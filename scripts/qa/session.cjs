// Signs the browser in as a demo user (mock auth) before the app loads, optionally with the sidebar hidden.
module.exports = async function prepare(page, { userId = 'u_1', collapsed = false, signedIn = true } = {}) {
  await page.addInitScript(({ uid, col, auth }) => {
    try {
      if (auth && !localStorage.getItem('gs.auth')) localStorage.setItem('gs.auth', JSON.stringify({ userId: uid, token: 'demo.qa', expiresAt: Date.now() + 864e5 }));
      if (col) localStorage.setItem('gs.sidebarCollapsed', '1');
    } catch (e) { /* storage blocked */ }
  }, { uid: userId, col: collapsed, auth: signedIn });
};
