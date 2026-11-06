import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

const BASE = process.env.SAKU_BASE_URL ?? "http://localhost:3000";
const PASSWORD = "KCAU@2026";
const ART = "/opt/cursor/artifacts/role-flow";
const results = [];

fs.mkdirSync(ART, { recursive: true });

function record(person, pass, detail) {
  results.push({ person, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${person}: ${detail}`);
}

async function shot(page, name) {
  await page.screenshot({
    path: path.join(ART, `${String(results.length).padStart(2, "0")}-${name}.png`),
    fullPage: true,
  });
}

async function textOf(page) {
  return page.evaluate(() => document.body?.innerText ?? "");
}

async function waitForText(page, pattern, timeout = 25000) {
  const source = pattern instanceof RegExp ? pattern.source : pattern;
  const flags = pattern instanceof RegExp ? pattern.flags : "i";
  await page.waitForFunction(
    (src, fl) => new RegExp(src, fl).test(document.body?.innerText ?? ""),
    { timeout },
    source,
    flags,
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  await page.waitForSelector(`[name="${name}"]`, { timeout: 10000 });
  await page.click(`[name="${name}"]`, { clickCount: 3 });
  await page.type(`[name="${name}"]`, value);
}

async function loginCommission(page, workId) {
  await page.goto(`${BASE}/commission/login`, { waitUntil: "networkidle0" });
  await fillNamed(page, "workId", workId);
  await fillNamed(page, "password", PASSWORD);
  await clickText(page, "Continue");
  await page.waitForFunction(
    () => location.pathname.includes("/commission/mfa") || location.pathname.includes("/commission/authorize"),
    { timeout: 15000 },
  );
  if (page.url().includes("/commission/mfa")) {
    const body = await textOf(page);
    const code = (body.match(/\b(\d{6})\b/) || [])[1];
    if (!code) throw new Error("MFA page did not show a 6-digit code");
    const slots = await page.$$("input.otp-slot, input[inputmode='numeric']");
    for (let i = 0; i < 6; i += 1) {
      await slots[i].click();
      await slots[i].type(code[i]);
    }
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
    { timeout: 35000 },
  );
}

async function signOut(page) {
  const userMenu = await page.evaluateHandle(() =>
    [...document.querySelectorAll("button")].find((node) => (node.textContent ?? "").includes("EC User")) ?? null,
  );
  if (userMenu.asElement()) {
    await userMenu.asElement().click();
    await sleep(300);
    await clickText(page, "Sign out");
    await page.waitForFunction(() => location.pathname.includes("/commission/login"), { timeout: 15000 });
    return;
  }
  await page.goto(`${BASE}/commission/login`, { waitUntil: "networkidle0" });
}

async function chooseCandidate(page) {
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const choice = buttons.find((node) => {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      return (text === "Select" || text.endsWith(" Select") || text.includes("Select ticket")) && !text.includes("Selected");
    });
    if (!choice) {
      const card = buttons.find((node) => /Select(?!ed)/.test(node.textContent ?? "") && !/Review|Next|Submit/.test(node.textContent ?? ""));
      if (!card) return false;
      card.click();
      return true;
    }
    choice.click();
    return true;
  });
  if (!clicked) throw new Error("No candidate choice was available");
}

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,1100"],
  defaultViewport: { width: 1440, height: 1100 },
});
const page = await browser.newPage();
page.setDefaultTimeout(25000);

try {
  const reset = await fetch(`${BASE}/api/demo/reset`, { method: "POST" });
  if (!reset.ok) throw new Error(`Demo reset failed: ${reset.status}`);

  await loginCommission(page, "KCAU-ICT-001");
  const ictText = await textOf(page);
  const ictPass =
    /Access not granted/i.test(ictText) &&
    /Peter Kamau/i.test(ictText) &&
    /ICT is not an election account/i.test(ictText);
  await shot(page, "ict-denied");
  record("1. Systems administrator Eng. Peter Kamau (KCAU-ICT-001)", ictPass, ictPass
    ? "Refused after MFA. Access not granted; ICT is not an election account."
    : `Unexpected ICT outcome: ${ictText.slice(0, 280)}`);
  await clickText(page, "Return to login");
  await page.waitForFunction(() => location.pathname.includes("/commission/login"), { timeout: 15000 });

  await loginCommission(page, "KCAU-EC-004");
  const dash = await textOf(page);
  const commissionerDash = /Mr\. Otieno/i.test(dash) && /Commissioner/i.test(dash);
  await shot(page, "commissioner-dashboard");
  await page.goto(`${BASE}/commission/desks`, { waitUntil: "networkidle0" });
  await clickText(page, "Preview voter sign-in");
  await waitForText(page, "Election 1");
  await shot(page, "preview-voter-signin");
  await page.goto(`${BASE}/preview/voter/ballot`, { waitUntil: "networkidle0" });
  const voterPreview = await textOf(page);
  await shot(page, "preview-voter-ballot");
  await page.goto(`${BASE}/preview/elector`, { waitUntil: "networkidle0" });
  await shot(page, "preview-elector-signin");
  await page.goto(`${BASE}/preview/elector/ballot`, { waitUntil: "networkidle0" });
  for (let step = 0; step < 6; step += 1) {
    await page.waitForSelector("button");
    await chooseCandidate(page);
    await clickText(page, step === 5 ? "Review" : "Next");
    await sleep(400);
  }
  await clickText(page, "Confirm & submit vote");
  await clickText(page, "Submit final vote");
  await waitForText(page, "No elector vote was stored");
  const electorPreview = await textOf(page);
  await shot(page, "preview-elector-no-store");
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  const openingControl = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const opening = buttons.find((node) => (node.textContent ?? "").includes("Authorize opening"));
    return opening ? { present: true, disabled: opening.disabled } : { present: false, disabled: true };
  });
  const commissionerPass =
    commissionerDash &&
    /Ruaraka|School of Business|Delegate/i.test(voterPreview) &&
    /no elector vote was stored/i.test(electorPreview) &&
    (!openingControl.present || openingControl.disabled);
  record(
    "2. Commissioner Mr. Kevin Otieno (KCAU-EC-004, Ruaraka)",
    commissionerPass,
    commissionerPass
      ? "Dashboard opened. Previews work and do not store votes. Authorize opening is not usable."
      : `Dash=${commissionerDash} opening=${JSON.stringify(openingControl)}`,
  );
  await signOut(page);

  for (const extra of [
    ["KCAU-EC-005", "Ms. Chebet", "Faith Chebet", "Town"],
    ["KCAU-EC-006", "Mr. Mwangi", "Brian Mwangi", "Kitengela"],
    ["KCAU-EC-007", "Ms. Achieng", "Lydia Achieng", "Western"],
  ]) {
    await loginCommission(page, extra[0]);
    const body = await textOf(page);
    const ok = body.includes(extra[1]) && /Commissioner/i.test(body);
    await shot(page, `commissioner-${extra[0]}`);
    record(
      `2b. Commissioner ${extra[2]} (${extra[0]}, ${extra[3]})`,
      ok,
      ok ? `Dashboard opened for ${extra[1]}.` : body.slice(0, 200),
    );
    await signOut(page);
  }

  await loginCommission(page, "KCAU-EC-003");
  const sgDash = /Grace Mutiso|Ms\. Mutiso|Secretary General/i.test(await textOf(page));
  await page.goto(`${BASE}/commission/election/election-1?tab=structure`, { waitUntil: "networkidle0" });
  const structure = await textOf(page);
  const seesSeats = /Needs seat configuration|Electoral structure|Delegate seats/i.test(structure);
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  const sgOpening = await page.evaluate(() => {
    const opening = [...document.querySelectorAll("button")].find((node) =>
      (node.textContent ?? "").includes("Authorize opening"),
    );
    return Boolean(opening) && !opening.disabled;
  });
  await shot(page, "sg-structure");
  const sgPass = sgDash && seesSeats && !sgOpening;
  record(
    "3. Secretary General Ms. Grace Mutiso (KCAU-EC-003)",
    sgPass,
    sgPass
      ? "Dashboard opened. Seat setup visible. Cannot authorize opening. Seats left for the Chair."
      : `dash=${sgDash} seats=${seesSeats} canOpen=${sgOpening}`,
  );
  await signOut(page);

  await loginCommission(page, "KCAU-EC-002");
  await waitForText(page, "Welcome,");
  const vcDash = /Dr\. Omondi|Vice Chair/i.test(await textOf(page));
  const vcOpening = await page.evaluate(() => {
    const opening = [...document.querySelectorAll("button")].find((node) =>
      (node.textContent ?? "").includes("Authorize opening"),
    );
    return Boolean(opening) && !opening.disabled;
  });
  await shot(page, "vice-chair-can-open");
  record(
    "4. Vice Chair Dr. David Omondi (KCAU-EC-002)",
    vcDash && vcOpening,
    vcDash && vcOpening
      ? "Dashboard opened. Authorize opening is available. Left unclicked so the Chair owns the open."
      : `dash=${vcDash} opening=${vcOpening}`,
  );
  await signOut(page);

  await loginCommission(page, "KCAU-EC-001");
  await page.goto(`${BASE}/commission/election/election-1?tab=structure`, { waitUntil: "networkidle0" });
  await page.waitForSelector("input[placeholder='e.g. 2']");
  await page.click("input[placeholder='e.g. 2']");
  await page.type("input[placeholder='e.g. 2']", "2");
  await clickText(page, "Allocate on all remaining units");
  await waitForText(page, "2 seats ·");
  await page.waitForFunction(
    () => !(document.body?.innerText ?? "").includes("Needs seat configuration"),
    { timeout: 20000 },
  );
  const seatsText = await textOf(page);
  const seatsConfigured = /2 seats/i.test(seatsText) && !/Needs seat configuration/i.test(seatsText);
  await shot(page, "chair-seats");
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  await clickText(page, "Authorize opening");
  await page.waitForSelector("input[type='password']");
  await page.type("input[type='password']", PASSWORD);
  await clickText(page, "Confirm");
  await waitForText(page, "Voting in progress");
  await shot(page, "chair-opened");
  await page.goto(`${BASE}/commission/desks`, { waitUntil: "networkidle0" });
  const desks = await textOf(page);
  const voterOpen = /Open for sign-in/i.test(desks);
  const electorWaiting = /Waiting for Election 1/i.test(desks);
  await shot(page, "desks-after-open");
  await page.goto(`${BASE}/commission/database`, { waitUntil: "networkidle0" });
  const dbText = await textOf(page);
  const dbPass =
    /MongoDB/i.test(dbText) &&
    /KCAU-EC-001/i.test(dbText) &&
    /24\/01201/i.test(dbText) &&
    !/\$2[aby]\$/i.test(dbText);
  await shot(page, "database-mongodb");
  record(
    "5. Chair Prof. Amina Wanjiku (KCAU-EC-001) opens the voter desk",
    seatsConfigured && voterOpen && electorWaiting && dbPass,
    `seats=${seatsConfigured} voterOpen=${voterOpen} electorWaiting=${electorWaiting} mongo=${dbPass}`,
  );
  await signOut(page);

  await page.goto(`${BASE}/elector`, { waitUntil: "networkidle0" });
  await fillNamed(page, "studentId", "24/01201");
  await fillNamed(page, "pin", "SAKU2026");
  await clickText(page, "Open my ballot");
  await waitForText(page, "Ruaraka");
  const ballot = await textOf(page);
  const unitOk = /Ruaraka/i.test(ballot) && /School of Business/i.test(ballot) && !/School of Technology/i.test(ballot);
  await shot(page, "student-ballot");
  await chooseCandidate(page);
  await chooseCandidate(page);
  await clickText(page, "Review & submit");
  await clickText(page, "Submit");
  await waitForText(page, "ballot was received");
  await shot(page, "student-received");
  await page.goto(`${BASE}/elector`, { waitUntil: "networkidle0" });
  await fillNamed(page, "studentId", "24/01201");
  await fillNamed(page, "pin", "SAKU2026");
  await clickText(page, "Open my ballot");
  await waitForText(page, /already voted|second ballot/i);
  await shot(page, "student-no-second-vote");
  record(
    "6. Student voter Ann Wanjiru Kamau (24/01201)",
    unitOk,
    unitOk
      ? "Ballot limited to Ruaraka School of Business. First vote received. Second vote refused."
      : ballot.slice(0, 280),
  );

  await page.goto(`${BASE}/x/saku-roll`, { waitUntil: "networkidle0" });
  await waitForText(page, "Student roll");
  await fillNamed(page, "operatorKey", "KCA-ROLL-2026");
  await fillNamed(page, "fullName", "Mercy Akinyi Tester");
  await fillNamed(page, "studentId", "24/09901");
  await page.select("select[name='course']", "campus-ruaraka|school-ru-bus|dept-ru-bus-bam");
  await fillNamed(page, "password", "VoteNow26");
  await fillNamed(page, "confirmPassword", "VoteNow26");
  await clickText(page, "Register student");
  await waitForText(page, "stored in MongoDB");
  await shot(page, "hidden-enroll");
  await page.goto(`${BASE}/elector`, { waitUntil: "networkidle0" });
  await fillNamed(page, "studentId", "24/09901");
  await fillNamed(page, "pin", "VoteNow26");
  await clickText(page, "Open my ballot");
  await waitForText(page, "Ruaraka");
  await chooseCandidate(page);
  await clickText(page, "Review & submit");
  await clickText(page, "Submit");
  await waitForText(page, "ballot was received");
  await shot(page, "enrolled-student-voted");
  const enrollVotes = await fetch("http://127.0.0.1:4000/votes?kind=election1", {
    headers: { "x-saku-ops-key": "saku-ops-demo-key" },
  }).then((res) => res.json());
  const storedAnn = Array.isArray(enrollVotes) && enrollVotes.some((vote) => vote.studentId === "24/01201");
  const storedEnrolled = Array.isArray(enrollVotes) && enrollVotes.some((vote) => vote.studentId === "24/09901");
  record(
    "Hidden operator roll 24/09901 Mercy Akinyi Tester",
    storedAnn && storedEnrolled,
    storedAnn && storedEnrolled
      ? "Hidden registration stored in MongoDB. Enrolled student voted once with the password set on the roll."
      : `ann=${storedAnn} enrolled=${storedEnrolled}`,
  );

  await loginCommission(page, "KCAU-EC-001");
  await page.goto(`${BASE}/commission/election/election-1?tab=results`, { waitUntil: "networkidle0" });
  await clickText(page, "Apply demonstration tallies");
  await sleep(800);
  await clickText(page, "Finalize elected delegates");
  await sleep(800);
  await page.goto(`${BASE}/commission/election/election-1?tab=college`, { waitUntil: "networkidle0" });
  await clickText(page, "Generate register from results");
  await sleep(800);
  await clickText(page, "Verify and activate");
  await waitForText(page, /Status:\s*active/i);
  const college = await textOf(page);
  const reg = (college.match(/24\/\d{5}/) || [])[0] ?? "";
  await shot(page, "college-active");
  await page.goto(`${BASE}/commission/desks`, { waitUntil: "networkidle0" });
  const desks2 = await textOf(page);
  const electorOpen = /Open for sign-in/i.test(desks2) && /register status: active/i.test(desks2);
  await shot(page, "elector-desk-open");
  const chairActivatePass = Boolean(reg) && electorOpen;
  record(
    "7. Chair activates the elector desk",
    chairActivatePass,
    chairActivatePass
      ? `Register active. First registration number ${reg}. Elector desk open for sign-in.`
      : `reg=${reg} desks=${desks2.slice(0, 200)}`,
  );
  await signOut(page);

  await page.goto(`${BASE}/vote`, { waitUntil: "networkidle0" });
  await page.waitForSelector("input");
  const inputs = await page.$$("input");
  await inputs[0].type(reg);
  await clickText(page, "Issue OTP");
  await waitForText(page, /Demonstration OTP/i);
  const otpBody = await textOf(page);
  const otp = (otpBody.match(/Demonstration OTP:\s*(\d{6})/) || otpBody.match(/\b(\d{6})\b/) || [])[1];
  const otpInput = (await page.$$("input"))[1];
  await otpInput.type(otp);
  await clickText(page, "Unlock ballot");
  await waitForText(page, "Step 1 of 6");
  await shot(page, "cabinet-step-1");
  for (let step = 0; step < 6; step += 1) {
    await chooseCandidate(page);
    await clickText(page, step === 5 ? "Review" : "Next");
    await sleep(500);
  }
  await clickText(page, "Confirm & submit vote");
  await clickText(page, "Submit final vote");
  await waitForText(page, /elector vote was received/i);
  await shot(page, "elector-received");
  await page.goto(`${BASE}/vote`, { waitUntil: "networkidle0" });
  const againInputs = await page.$$("input");
  await againInputs[0].type(reg);
  await clickText(page, "Issue OTP");
  await waitForText(page, /already voted|no longer valid|cannot/i);
  await shot(page, "elector-no-second-vote");
  record(
    `8. Elector ${reg}`,
    true,
    "Six-step Cabinet ballot submitted. Elector vote received. Registration number cannot vote again.",
  );

  await loginCommission(page, "KCAU-EC-002");
  await page.goto(`${BASE}/commission/election/election-1?tab=results`, { waitUntil: "networkidle0" });
  const vcResults = await textOf(page);
  const seesResults = /Stored ballots|votes/i.test(vcResults);
  await shot(page, "vc-results");
  await page.goto(`${BASE}/commission/database`, { waitUntil: "networkidle0" });
  const vcDb = await textOf(page);
  const seesDb = /MongoDB/i.test(vcDb) && /stored ballots/i.test(vcDb);
  await page.goto(`${BASE}/commission/dashboard`, { waitUntil: "networkidle0" });
  const vcCannotAuthorize = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    return !buttons.some((node) => (node.textContent ?? "").includes("Authorize official results") && !node.disabled);
  });
  await shot(page, "vc-no-authorize-results");
  record(
    "9. Vice Chair confirms results",
    seesResults && seesDb && vcCannotAuthorize,
    seesResults && seesDb && vcCannotAuthorize
      ? "Results and stored ballots visible. Vice Chair cannot authorize official results."
      : `results=${seesResults} db=${seesDb} noAuthorize=${vcCannotAuthorize}`,
  );
  await signOut(page);
} catch (error) {
  record("Runner", false, error.stack || String(error));
  try {
    await shot(page, "failure");
  } catch {
    // ignore
  }
} finally {
  fs.writeFileSync(path.join(ART, "results.json"), JSON.stringify(results, null, 2));
  await browser.close();
  const failed = results.filter((item) => !item.pass);
  console.log(JSON.stringify({ failed: failed.length, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}
