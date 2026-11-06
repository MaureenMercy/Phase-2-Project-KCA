import puppeteer from "puppeteer";

const BASE = process.env.SAKU_BASE_URL ?? "http://localhost:3000";
const PASSWORD = "KCAU@2026";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function textOf(page) {
  return page.evaluate(() => document.body?.innerText ?? "");
}

async function waitForText(page, pattern, timeout = 30000) {
  const source = pattern instanceof RegExp ? pattern.source : pattern;
  const flags = pattern instanceof RegExp ? pattern.flags : "i";
  await page.waitForFunction(
    (src, fl) => new RegExp(src, fl).test(document.body?.innerText ?? ""),
    { timeout },
    source,
    flags,
  );
}

async function clickText(page, label) {
  const handle = await page.evaluateHandle((wanted) => {
    const nodes = [...document.querySelectorAll("a, button, label, summary")];
    return (
      nodes.find((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim() === wanted) ??
      nodes.find((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim().includes(wanted)) ??
      null
    );
  }, label);
  const element = handle.asElement();
  if (!element) throw new Error(`No control labelled ${label}`);
  await element.click();
}

async function fillNamed(page, name, value) {
  await page.waitForSelector(`[name="${name}"]`, { timeout: 15000 });
  await page.click(`[name="${name}"]`, { clickCount: 3 });
  await page.type(`[name="${name}"]`, value, { delay: 55 });
}

async function banner(page, title) {
  await page.evaluate((text) => {
    let bar = document.getElementById("saku-demo-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "saku-demo-bar";
      bar.style.cssText =
        "position:fixed;left:20px;right:20px;bottom:18px;z-index:2147483647;background:#182B5C;color:#F6E7C1;border:2px solid #D0B216;padding:12px 18px;font:700 18px/1.35 sans-serif;text-align:center;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.35)";
      document.body.appendChild(bar);
    }
    bar.textContent = text;
  }, title);
}

async function hold(page, title, ms = 2200) {
  await banner(page, title);
  await sleep(ms);
}

async function loginCommission(page, workId) {
  await page.goto(`${BASE}/commission/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[name="workId"]', { visible: true, timeout: 40000 });
  await sleep(600);
  await fillNamed(page, "workId", workId);
  await fillNamed(page, "password", PASSWORD);
  await clickText(page, "Continue");
  await page.waitForFunction(
    () => location.pathname.includes("/commission/mfa") || location.pathname.includes("/commission/authorize"),
    { timeout: 20000 },
  );
  if (page.url().includes("/commission/mfa")) {
    await sleep(900);
    const body = await textOf(page);
    const code = (body.match(/\b(\d{6})\b/) || [])[1];
    if (!code) throw new Error("MFA page did not show a 6-digit code");
    const slots = await page.$$("input.otp-slot, input[inputmode='numeric']");
    for (let i = 0; i < 6; i += 1) {
      await slots[i].click();
      await slots[i].type(code[i], { delay: 80 });
    }
    await sleep(400);
    await clickText(page, "Verify one-time password");
  }
  await page.waitForFunction(
    () => {
      const path = location.pathname;
      const text = document.body?.innerText ?? "";
      return (
        (/\/commission\/dashboard/.test(path) && /Welcome,/.test(text)) ||
        (/\/commission\/denied/.test(path) && /Access not granted/.test(text))
      );
    },
    { timeout: 40000 },
  );
  await sleep(800);
}

async function signOut(page) {
  const userMenu = await page.evaluateHandle(
    () => [...document.querySelectorAll("button")].find((node) => (node.textContent ?? "").includes("EC User")) ?? null,
  );
  if (userMenu.asElement()) {
    await userMenu.asElement().click();
    await sleep(500);
    await clickText(page, "Sign out");
    await page.waitForFunction(() => location.pathname.includes("/commission/login"), { timeout: 20000 });
    await sleep(700);
    return;
  }
  await page.goto(`${BASE}/commission/login`, { waitUntil: "networkidle0" });
}

async function chooseCandidate(page) {
  await page.waitForSelector("button");
  await sleep(250);
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")].filter((node) => node.offsetParent);
    const usable = buttons.find((node) => {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (/Review|Next|Back|Submit|Confirm|Cancel/.test(text)) return false;
      if (text.includes("Selected")) return false;
      return text.includes("Select ticket") || /\bSelect\b/.test(text) || node.querySelector("img");
    });
    if (!usable) return false;
    usable.click();
    return true;
  });
  if (!clicked) throw new Error("No candidate choice was available");
  await sleep(350);
}

const browser = await puppeteer.launch({
  headless: false,
  executablePath: "/home/ubuntu/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome",
  env: { ...process.env, DISPLAY: ":1" },
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--window-size=1920,1100",
    "--window-position=0,0",
    "--start-maximized",
    "--disable-infobars",
    "--no-first-run",
    "--user-data-dir=/tmp/saku-desk-demo-chrome",
  ],
  defaultViewport: { width: 1920, height: 1080 },
  slowMo: 28,
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
page.setDefaultTimeout(40000);
try {
  const session = await page.createCDPSession();
  const { windowId } = await session.send("Browser.getWindowForTarget");
  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: { left: 0, top: 0, width: 1920, height: 1200, windowState: "normal" },
  });
} catch {
  // Keep going if the window cannot be resized.
}

let registrationNumber = "";

try {
  await loginCommission(page, "KCAU-ICT-001");
  await waitForText(page, "Access not granted");
  await hold(page, "1. Systems administrator — Eng. Peter Kamau is refused. ICT is not an election account.", 3200);
  await clickText(page, "Return to login");
  await page.waitForFunction(() => location.pathname.includes("/commission/login"), { timeout: 15000 });
  await sleep(800);

  await loginCommission(page, "KCAU-EC-004");
  await waitForText(page, "Mr. Otieno");
  await hold(page, "2. Commissioner — Mr. Kevin Otieno, Ruaraka. Dashboard shows his name.", 2800);
  await page.goto(`${BASE}/commission/desks`, { waitUntil: "networkidle0" });
  await sleep(700);
  await clickText(page, "Preview voter sign-in");
  await waitForText(page, "Election 1");
  await hold(page, "Preview voter sign-in — student screen only. Nothing is stored.", 2400);
  await page.goto(`${BASE}/preview/voter/ballot`, { waitUntil: "networkidle0" });
  await sleep(800);
  await hold(page, "Preview voter ballot — candidates from the student’s own unit.", 2400);
  await page.goto(`${BASE}/preview/elector`, { waitUntil: "networkidle0" });
  await sleep(800);
  await hold(page, "Preview elector sign-in.", 1800);
  await page.goto(`${BASE}/preview/elector/ballot`, { waitUntil: "networkidle0" });
  await waitForText(page, "Step 1 of 6");
  for (let step = 0; step < 6; step += 1) {
    await page.waitForSelector("button");
    await chooseCandidate(page);
    await clickText(page, step === 5 ? "Review" : "Next");
    await sleep(450);
  }
  await clickText(page, "Confirm & submit vote");
  await sleep(400);
  await clickText(page, "Submit final vote");
  await waitForText(page, "No elector vote was stored");
  await hold(page, "Preview only. No elector vote was stored.", 2800);
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  await sleep(800);
  await hold(page, "No usable Authorize opening control for a commissioner.", 2800);
  await signOut(page);

  for (const extra of [
    ["KCAU-EC-005", "Ms. Chebet", "Faith Chebet, Town"],
    ["KCAU-EC-006", "Mr. Mwangi", "Brian Mwangi, Kitengela"],
    ["KCAU-EC-007", "Ms. Achieng", "Lydia Achieng, Western"],
  ]) {
    await loginCommission(page, extra[0]);
    await waitForText(page, extra[1]);
    await hold(page, `Station commissioner login — ${extra[2]}. Then sign out.`, 2400);
    await signOut(page);
  }

  await loginCommission(page, "KCAU-EC-003");
  await waitForText(page, "Secretary General");
  await hold(page, "3. Secretary General — Ms. Grace Mutiso.", 2400);
  await page.goto(`${BASE}/commission/election/election-1?tab=structure`, { waitUntil: "networkidle0" });
  await waitForText(page, "Needs seat configuration");
  await hold(page, "She can see the seat setup. Seats are left for the Chair.", 2800);
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  await sleep(800);
  await hold(page, "Secretary General cannot authorize opening.", 2400);
  await signOut(page);

  await loginCommission(page, "KCAU-EC-002");
  await waitForText(page, "Vice Chair");
  await hold(page, "4. Vice Chair — Dr. David Omondi. Authorize opening is available. Not clicked.", 3200);
  await signOut(page);

  await loginCommission(page, "KCAU-EC-001");
  await waitForText(page, "Prof. Wanjiku");
  await hold(page, "5. Chair — Prof. Amina Wanjiku opens the voter desk.", 2200);
  await page.goto(`${BASE}/commission/election/election-1?tab=structure`, { waitUntil: "networkidle0" });
  await page.waitForSelector("input[placeholder='e.g. 2']");
  await page.click("input[placeholder='e.g. 2']");
  await page.type("input[placeholder='e.g. 2']", "2", { delay: 120 });
  await clickText(page, "Allocate on all remaining units");
  await waitForText(page, "2 seats ·");
  await page.waitForFunction(
    () => !(document.body?.innerText ?? "").includes("Needs seat configuration"),
    { timeout: 20000 },
  );
  await hold(page, "Seat numbers replace Needs seat configuration.", 2800);
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  await sleep(700);
  await clickText(page, "Authorize opening");
  await page.waitForSelector("input[type='password']");
  await page.type("input[type='password']", PASSWORD, { delay: 70 });
  await clickText(page, "Confirm");
  await waitForText(page, "Voting in progress");
  await hold(page, "Lifecycle: Voting in progress.", 2800);
  await page.goto(`${BASE}/commission/desks`, { waitUntil: "networkidle0" });
  await waitForText(page, "Open for sign-in");
  await hold(page, "Voter desk open. Elector desk still waiting for Election 1.", 2800);
  await page.goto(`${BASE}/commission/database`, { waitUntil: "networkidle0" });
  await waitForText(page, "MongoDB");
  await hold(page, "Database: MongoDB. Commission accounts and students listed. No password hashes.", 3000);
  await signOut(page);

  await page.goto(`${BASE}/elector`, { waitUntil: "networkidle0" });
  await hold(page, "6. Student voter — Ann Wanjiru Kamau, 24/01201.", 2000);
  await fillNamed(page, "studentId", "24/01201");
  await fillNamed(page, "pin", "SAKU2026");
  await clickText(page, "Open my ballot");
  await waitForText(page, "Ruaraka");
  await hold(page, "Ballot lists only Ruaraka School of Business candidates.", 2800);
  await chooseCandidate(page);
  await chooseCandidate(page);
  await clickText(page, "Review & submit");
  await sleep(400);
  await clickText(page, "Submit");
  await waitForText(page, "ballot was received");
  await hold(page, "The ballot was received and stored.", 2800);
  await page.goto(`${BASE}/elector`, { waitUntil: "networkidle0" });
  await fillNamed(page, "studentId", "24/01201");
  await fillNamed(page, "pin", "SAKU2026");
  await clickText(page, "Open my ballot");
  await waitForText(page, "already voted");
  await hold(page, "She cannot vote a second time.", 2800);

  await loginCommission(page, "KCAU-EC-001");
  await hold(page, "7. Chair again — activate the elector desk.", 2000);
  await page.goto(`${BASE}/commission/election/election-1?tab=results`, { waitUntil: "networkidle0" });
  await clickText(page, "Apply demonstration tallies");
  await sleep(1100);
  await clickText(page, "Finalize elected delegates");
  await sleep(1100);
  await page.goto(`${BASE}/commission/election/election-1?tab=college`, { waitUntil: "networkidle0" });
  await clickText(page, "Generate register from results");
  await sleep(1100);
  await clickText(page, "Verify and activate");
  await waitForText(page, "Status:");
  await waitForText(page, "active");
  const college = await textOf(page);
  registrationNumber = (college.match(/24\/\d{5}/) || [])[0] ?? "";
  await hold(page, `Register active. First registration number ${registrationNumber}.`, 3000);
  await page.goto(`${BASE}/commission/desks`, { waitUntil: "networkidle0" });
  await waitForText(page, "Open for sign-in");
  await hold(page, "Elector desk is now Open for sign-in.", 2600);
  await signOut(page);

  await page.goto(`${BASE}/vote`, { waitUntil: "networkidle0" });
  await hold(page, `8. Elector / Cabinet voter — registration ${registrationNumber}.`, 2200);
  await page.waitForSelector("input");
  const inputs = await page.$$("input");
  await inputs[0].type(registrationNumber, { delay: 70 });
  await clickText(page, "Issue OTP");
  await waitForText(page, "Demonstration OTP");
  const otpBody = await textOf(page);
  const otp = (otpBody.match(/Demonstration OTP:\s*(\d{6})/) || otpBody.match(/\b(\d{6})\b/) || [])[1];
  const otpInput = (await page.$$("input"))[1];
  await otpInput.type(otp, { delay: 80 });
  await clickText(page, "Unlock ballot");
  await waitForText(page, "Step 1 of 6");
  await hold(page, "Six-step Cabinet ballot.", 1800);
  for (let step = 0; step < 6; step += 1) {
    await chooseCandidate(page);
    await clickText(page, step === 5 ? "Review" : "Next");
    await sleep(500);
  }
  await clickText(page, "Confirm & submit vote");
  await sleep(400);
  await clickText(page, "Submit final vote");
  await waitForText(page, "elector vote was received");
  await hold(page, "The elector vote was received and stored.", 2800);
  await page.goto(`${BASE}/vote`, { waitUntil: "networkidle0" });
  const againInputs = await page.$$("input");
  await againInputs[0].type(registrationNumber, { delay: 70 });
  await clickText(page, "Issue OTP");
  await waitForText(page, "already voted");
  await hold(page, "That registration number cannot vote again.", 2800);

  await loginCommission(page, "KCAU-EC-002");
  await hold(page, "9. Vice Chair confirms results. Stop.", 2000);
  await page.goto(`${BASE}/commission/election/election-1?tab=results`, { waitUntil: "networkidle0" });
  await waitForText(page, "Stored ballots");
  await hold(page, "Election 1 results and stored ballots are visible.", 2800);
  await page.goto(`${BASE}/commission/database`, { waitUntil: "networkidle0" });
  await waitForText(page, "MongoDB");
  await hold(page, "Database shows the stored records in MongoDB.", 2600);
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  await sleep(800);
  await hold(page, "Vice Chair does not get Authorize official results. That stays with the Chair.", 3500);
  await signOut(page);
  await hold(page, "Desk test complete. ICT refused. Commissioner preview only. Chair opened voting. One student, one elector.", 4000);
  console.log(JSON.stringify({ ok: true, registrationNumber }));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sleep(1500);
  await browser.close();
}
