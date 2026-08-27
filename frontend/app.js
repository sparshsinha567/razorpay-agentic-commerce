document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const toastContainer = document.getElementById("toastContainer");
  function showToast(message, type = "info") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    let bg = "bg-white border-zinc-200 text-zinc-900 shadow-xl";
    let icon = "info";
    let iconColor = "text-brand-500";
    if (type === "success") {
      bg = "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xl";
      icon = "check-circle";
      iconColor = "text-emerald-600";
    } else if (type === "error" || type === "alert") {
      bg = "bg-red-50 border-red-200 text-red-900 shadow-xl";
      icon = "alert-circle";
      iconColor = "text-red-600";
    }

    toast.className = `${bg} border px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto font-medium`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0 ${iconColor}"></i><span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    }, 10);

    setTimeout(() => {
      toast.classList.add("translate-y-2", "opacity-0");
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  const headerViewTitle = document.getElementById("headerViewTitle");
  const headerViewSubtitle = document.getElementById("headerViewSubtitle");
  const backToWorkspaceBtn = document.getElementById("backToWorkspaceBtn");
  const navBrand = document.getElementById("navBrand");

  function switchView(targetViewId) {
    const allViews = document.querySelectorAll(".dashboard-view");
    allViews.forEach(v => v.classList.add("hidden"));
    const target = document.getElementById(`view-${targetViewId}`);
    if (target) target.classList.remove("hidden");

    document.querySelectorAll(".nav-tab").forEach(tab => {
      const v = tab.getAttribute("data-view");
      if (v === targetViewId) {
        tab.className = "nav-tab bg-brand-500/10 text-brand-500 font-semibold text-sm flex px-3 py-2 items-center gap-2 rounded-lg transition";
      } else {
        tab.className = "nav-tab text-zinc-500 hover:text-zinc-900 text-sm font-medium flex px-3 py-2 items-center gap-2 rounded-lg transition";
      }
    });

    const titles = {
      agents: { title: "Agent Invoices & Bounded Checkout Workspace", sub: "AI Growth · Agentic Commerce" },
      dashboard: { title: "Merchant Revenue Growth Telemetry", sub: "Track 01 Overview & GMV Metrics" },
      orders: { title: "Orders & Settlements", sub: "Verified Captures & Invoices" },
      analytics: { title: "Explainable Audit Ledger", sub: "Security, Pydantic & Protocol Records" },
      catalog: { title: "Verified Product Catalog", sub: "Machine-Readable SKUs & Addons" },
      signin: { title: "Account Sign In (Screen 2)", sub: "JWT Session Issuance & Autonomous Access" },
      signup: { title: "Account Registration (Screen 3)", sub: "Guardrail Safety & Merchant Credentials" },
      settings: { title: "Dashboard Settings", sub: "Theme & Safety Guardrails" }
    };

    if (headerViewTitle && titles[targetViewId]) {
      headerViewTitle.textContent = titles[targetViewId].title;
      headerViewSubtitle.textContent = titles[targetViewId].sub;
    }

    if (window.lucide) window.lucide.createIcons();
    if (targetViewId === "dashboard") fetchStats();
    if (targetViewId === "orders") renderPaymentsTable();
    if (targetViewId === "analytics") renderFullAuditTable(fullAuditLedger);
    if (targetViewId === "catalog") renderFullCatalog(catalogList);
  }

  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-view]");
    if (tab) {
      const v = tab.getAttribute("data-view");
      if (v) {
        e.preventDefault();
        switchView(v);
      }
    }
  });

  if (backToWorkspaceBtn) backToWorkspaceBtn.addEventListener("click", () => switchView("agents"));
  if (navBrand) navBrand.addEventListener("click", () => switchView("agents"));

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  const settingsThemeLightBtn = document.getElementById("settingsThemeLightBtn");
  const settingsThemeDarkBtn = document.getElementById("settingsThemeDarkBtn");

  function setTheme(mode) {
    if (mode === "dark") {
      document.body.classList.add("dark-theme");
      document.documentElement.classList.add("dark");
      if (sunIcon) sunIcon.classList.add("hidden");
      if (moonIcon) moonIcon.classList.remove("hidden");
      if (settingsThemeDarkBtn) settingsThemeDarkBtn.className = "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-brand-500 bg-brand-500/10 text-brand-500 font-semibold text-xs transition";
      if (settingsThemeLightBtn) settingsThemeLightBtn.className = "flex items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold text-xs transition";
      localStorage.setItem("app_theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      document.documentElement.classList.remove("dark");
      if (sunIcon) sunIcon.classList.remove("hidden");
      if (moonIcon) moonIcon.classList.add("hidden");
      if (settingsThemeLightBtn) settingsThemeLightBtn.className = "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-brand-500 bg-brand-50 text-brand-700 font-semibold text-xs transition";
      if (settingsThemeDarkBtn) settingsThemeDarkBtn.className = "flex items-center justify-center gap-2 p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 font-semibold text-xs transition";
      localStorage.setItem("app_theme", "light");
    }
  }

  const savedTheme = localStorage.getItem("app_theme") || "light";
  setTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-theme");
      setTheme(isDark ? "light" : "dark");
      showToast(`${isDark ? "Clean Light" : "Dark"} Mode activated`, "info");
    });
  }

  if (settingsThemeLightBtn) settingsThemeLightBtn.addEventListener("click", () => { setTheme("light"); showToast("Light Mode active", "info"); });
  if (settingsThemeDarkBtn) settingsThemeDarkBtn.addEventListener("click", () => { setTheme("dark"); showToast("Dark Mode active", "info"); });

  let currentSessionLimit = 5000;
  const navLimitDisplay = document.getElementById("navLimitDisplay");
  const cardLimitDisplay = document.getElementById("cardLimitDisplay");
  const profileLimitDisplay = document.getElementById("profileLimitDisplay");
  const sessionBudgetUsage = document.getElementById("sessionBudgetUsage");

  const sessionLimitBtn = document.getElementById("sessionLimitBtn");
  const guardrailModal = document.getElementById("guardrailModal");
  const closeGuardrailBtn = document.getElementById("closeGuardrailBtn");
  const customLimitInput = document.getElementById("customLimitInput");
  const saveLimitBtn = document.getElementById("saveLimitBtn");
  const limitPresetBtns = document.querySelectorAll(".limit-preset-btn");

  const settingsCustomLimit = document.getElementById("settingsCustomLimit");
  const settingsSaveLimitBtn = document.getElementById("settingsSaveLimitBtn");

  function updateLimitDisplays(limit) {
    currentSessionLimit = limit;
    const formatted = `₹${limit.toLocaleString()}.00`;
    const shortK = `₹${(limit / 1000).toFixed(0)}k`;

    if (navLimitDisplay) navLimitDisplay.textContent = formatted;
    if (cardLimitDisplay) cardLimitDisplay.textContent = shortK;
    if (profileLimitDisplay) profileLimitDisplay.textContent = formatted;
    if (sessionBudgetUsage) {
      const spent = typeof getCartTotalInr === 'function' ? getCartTotalInr() : (activeProduct ? activeProduct.price_inr : 2499);
      sessionBudgetUsage.textContent = `₹${spent.toLocaleString()} / ₹${limit.toLocaleString()} used`;
    }
  }

  if (sessionLimitBtn) {
    sessionLimitBtn.addEventListener("click", () => {
      if (customLimitInput) customLimitInput.value = currentSessionLimit;
      guardrailModal.classList.remove("hidden");
    });
  }

  if (closeGuardrailBtn) {
    closeGuardrailBtn.addEventListener("click", () => guardrailModal.classList.add("hidden"));
  }

  limitPresetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.getAttribute("data-limit"));
      if (customLimitInput) customLimitInput.value = val;
      if (settingsCustomLimit) settingsCustomLimit.value = val;
    });
  });

  async function handleSaveLimit(newLimit) {
    try {
      const resp = await fetch("/api/agent/update_config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_limit_inr: newLimit })
      });
      const data = await resp.json();
      updateLimitDisplays(data.max_limit_inr);
      guardrailModal.classList.add("hidden");
      showToast(`Guardrail session bound updated to ₹${data.max_limit_inr.toLocaleString()}.00`, "success");
      await fetchAuditTrail();
    } catch (e) {
      console.error(e);
      showToast("Failed to update limit", "error");
    }
  }

  if (saveLimitBtn) {
    saveLimitBtn.addEventListener("click", () => {
      const val = parseFloat(customLimitInput.value) || 5000;
      handleSaveLimit(val);
    });
  }

  if (settingsSaveLimitBtn) {
    settingsSaveLimitBtn.addEventListener("click", () => {
      const val = parseFloat(settingsCustomLimit.value) || 5000;
      handleSaveLimit(val);
    });
  }

  const searchLogsInput = document.getElementById("searchLogsInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");

  if (searchLogsInput) {
    searchLogsInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (clearSearchBtn) {
        if (q) clearSearchBtn.classList.remove("hidden");
        else clearSearchBtn.classList.add("hidden");
      }
      if (!q) {
        renderAuditTimeline(fullAuditLedger);
        renderFullAuditTable(fullAuditLedger);
        return;
      }
      const filtered = fullAuditLedger.filter(entry => 
        entry.action.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.phase.toLowerCase().includes(q) ||
        (entry.guardrail_status && entry.guardrail_status.toLowerCase().includes(q))
      );
      renderAuditTimeline(filtered);
      renderFullAuditTable(filtered);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      searchLogsInput.value = "";
      clearSearchBtn.classList.add("hidden");
      renderAuditTimeline(fullAuditLedger);
      renderFullAuditTable(fullAuditLedger);
    });
  }

  const notificationsBtn = document.getElementById("notificationsBtn");
  const notificationsDropdown = document.getElementById("notificationsDropdown");
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const markReadBtn = document.getElementById("markReadBtn");

  const profileBtn = document.getElementById("profileBtn");
  const profileDropdown = document.getElementById("profileDropdown");
  const profileEditLimitBtn = document.getElementById("profileEditLimitBtn");
  const resetSessionBtn = document.getElementById("resetSessionBtn");

  async function loadNotifications() {
    try {
      const resp = await fetch("/api/agent/notifications");
      const data = await resp.json();
      if (!notifList) return;
      notifList.innerHTML = "";

      (data.notifications || []).forEach(n => {
        const item = document.createElement("div");
        item.className = "flex items-start gap-2.5 p-2 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition text-xs";
        item.innerHTML = `
          <div class="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="${n.icon || 'bell'}" class="w-3 h-3"></i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
              <h5 class="font-semibold text-zinc-900">${n.title}</h5>
              <span class="text-[10px] text-zinc-400 font-mono">${n.time}</span>
            </div>
            <p class="text-[11px] text-zinc-500 mt-0.5">${n.desc}</p>
          </div>
        `;
        notifList.appendChild(item);
      });
      if (window.lucide) window.lucide.createIcons();
    } catch (e) {
      console.error(e);
    }
  }

  if (notificationsBtn) {
    notificationsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (profileDropdown) profileDropdown.classList.add("hidden");
      notificationsDropdown.classList.toggle("hidden");
      if (!notificationsDropdown.classList.contains("hidden")) loadNotifications();
    });
  }

  if (markReadBtn) {
    markReadBtn.addEventListener("click", () => {
      if (notifBadge) notifBadge.classList.add("hidden");
      showToast("Notifications marked as read", "info");
    });
  }

  let currentUser = null;
  let currentJwtToken = localStorage.getItem("agent_jwt_token") || null;
  let isAuthSignUpMode = false;

  const authNavBtn = document.getElementById("authNavBtn");
  const authNavText = document.getElementById("authNavText");
  const authNavIcon = document.getElementById("authNavIcon");
  const profileDisplayName = document.getElementById("profileDisplayName");
  const profileAuthStatus = document.getElementById("profileAuthStatus");
  const profileUsernameDisplay = document.getElementById("profileUsernameDisplay");
  const authModalTriggerBtn = document.getElementById("authModalTriggerBtn");
  const signOutBtn = document.getElementById("signOutBtn");

  const profileBtnAvatar = document.getElementById("profileBtnAvatar");
  const profileDropdownAvatar = document.getElementById("profileDropdownAvatar");

  function updateAuthUI(user) {
    currentUser = user;
    if (user && user.username) {
      const initials = (user.full_name || user.username).split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "U";
      if (authNavText) authNavText.textContent = user.username;
      if (authNavBtn) {
        authNavBtn.className = "rounded-full border border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 flex px-3 py-1.5 items-center gap-2 transition cursor-pointer text-xs font-semibold shadow-xs";
      }
      if (profileBtn) {
        profileBtn.className = "w-9 h-9 font-bold rounded-full bg-indigo-600 text-white text-xs flex justify-center items-center shadow-xs hover:scale-105 transition cursor-pointer";
      }
      if (profileBtnAvatar) profileBtnAvatar.textContent = initials;
      if (profileDropdownAvatar) {
        profileDropdownAvatar.className = "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm";
        profileDropdownAvatar.textContent = initials;
      }
      if (profileDisplayName) profileDisplayName.textContent = user.full_name || user.username;
      if (profileUsernameDisplay) profileUsernameDisplay.textContent = `@${user.username}`;
      if (profileAuthStatus) {
        profileAuthStatus.textContent = "Authenticated (JWT Session)";
        profileAuthStatus.className = "text-[11px] text-emerald-600 font-medium";
      }
      if (signOutBtn) signOutBtn.classList.remove("hidden");
      if (authModalTriggerBtn) authModalTriggerBtn.textContent = "Switch Account";
    } else {
      if (authNavText) authNavText.textContent = "Sign In";
      if (authNavBtn) {
        authNavBtn.className = "rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex px-3 py-1.5 items-center gap-2 transition cursor-pointer text-xs font-semibold shadow-xs";
      }
      if (profileBtn) {
        profileBtn.className = "w-9 h-9 font-bold rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs flex justify-center items-center shadow-xs hover:scale-105 transition cursor-pointer";
      }
      if (profileBtnAvatar) profileBtnAvatar.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i>`;
      if (profileDropdownAvatar) {
        profileDropdownAvatar.className = "w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center font-bold text-sm";
        profileDropdownAvatar.innerHTML = `<i data-lucide="user" class="w-5 h-5"></i>`;
      }
      if (profileDisplayName) profileDisplayName.textContent = "Guest";
      if (profileUsernameDisplay) profileUsernameDisplay.textContent = "None";
      if (profileAuthStatus) {
        profileAuthStatus.textContent = "Not Signed In";
        profileAuthStatus.className = "text-[11px] text-amber-600 font-medium";
      }
      if (signOutBtn) signOutBtn.classList.add("hidden");
      if (authModalTriggerBtn) authModalTriggerBtn.textContent = "Sign In to Account";
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function setAuthSession(token, user) {
    currentJwtToken = token;
    currentUser = user;
    if (token) localStorage.setItem("agent_jwt_token", token);
    else localStorage.removeItem("agent_jwt_token");

    if (user && user.username) {
      localStorage.setItem("agent_user_name", user.username);
    } else {
      localStorage.removeItem("agent_user_name");
    }
    updateAuthUI(user);
  }

  const authModal = document.getElementById("authModal");
  const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
  const popupScreen2Card = document.getElementById("popupScreen2Card");
  const popupScreen3Card = document.getElementById("popupScreen3Card");

  const popupLoginForm = document.getElementById("popupLoginForm");
  const popupIdentifierInput = document.getElementById("popupIdentifierInput");
  const popupPasswordInput = document.getElementById("popupPasswordInput");
  const popupTogglePasswordBtn = document.getElementById("popupTogglePasswordBtn");
  const popupPasswordEye = document.getElementById("popupPasswordEye");
  const popupRememberMe = document.getElementById("popupRememberMe");
  const popupForgotPwdBtn = document.getElementById("popupForgotPwdBtn");
  const popupLoginSubmitBtn = document.getElementById("popupLoginSubmitBtn");
  const popupLoginSubmitText = document.getElementById("popupLoginSubmitText");
  const popupDemoLoginBtn = document.getElementById("popupDemoLoginBtn");
  const popupAutofillBtn = document.getElementById("popupAutofillBtn");
  const popupSwitchToSignUpBtn = document.getElementById("popupSwitchToSignUpBtn");
  const popupAuthErrorAlert = document.getElementById("popupAuthErrorAlert");
  const popupAuthErrorMsg = document.getElementById("popupAuthErrorMsg");
  const popupAuthSuccessAlert = document.getElementById("popupAuthSuccessAlert");
  const popupAuthSuccessMsg = document.getElementById("popupAuthSuccessMsg");

  const popupSignUpForm = document.getElementById("popupSignUpForm");
  const popupFullNameInput = document.getElementById("popupFullNameInput");
  const popupUsernameInput = document.getElementById("popupUsernameInput");
  const popupEmailInput = document.getElementById("popupEmailInput");
  const popupSignUpPasswordInput = document.getElementById("popupSignUpPasswordInput");
  const popupConfirmPasswordInput = document.getElementById("popupConfirmPasswordInput");
  const popupTermsCheckbox = document.getElementById("popupTermsCheckbox");
  const popupSignUpSubmitBtn = document.getElementById("popupSignUpSubmitBtn");
  const popupSignUpSubmitText = document.getElementById("popupSignUpSubmitText");
  const popupSwitchToLoginBtn = document.getElementById("popupSwitchToLoginBtn");
  const popupSignUpErrorAlert = document.getElementById("popupSignUpErrorAlert");
  const popupSignUpErrorMsg = document.getElementById("popupSignUpErrorMsg");
  const popupSignUpSuccessAlert = document.getElementById("popupSignUpSuccessAlert");
  const popupSignUpSuccessMsg = document.getElementById("popupSignUpSuccessMsg");

  function openAuthModal(isSignUp = false) {
    if (!authModal) return;

    if (popupAuthErrorAlert) popupAuthErrorAlert.classList.add("hidden");
    if (popupAuthSuccessAlert) popupAuthSuccessAlert.classList.add("hidden");
    if (popupSignUpErrorAlert) popupSignUpErrorAlert.classList.add("hidden");
    if (popupSignUpSuccessAlert) popupSignUpSuccessAlert.classList.add("hidden");

    if (isSignUp) {
      if (popupScreen2Card) popupScreen2Card.classList.add("hidden");
      if (popupScreen3Card) popupScreen3Card.classList.remove("hidden");
    } else {
      if (popupScreen2Card) popupScreen2Card.classList.remove("hidden");
      if (popupScreen3Card) popupScreen3Card.classList.add("hidden");
    }

    authModal.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function closeAuthModal() {
    if (authModal) authModal.classList.add("hidden");
  }

  function clearAuthSession() {
    setAuthSession(null, null);
    showToast("Signed out. Please sign in to access the workspace.", "info");
    openAuthModal(false);
  }

  async function checkAuthStatus() {
    const token = localStorage.getItem("agent_jwt_token");
    if (!token) {
      updateAuthUI(null);
      openAuthModal(false); // Automatically popup Login modal on first visit
      return false;
    }
    try {
      const resp = await fetch("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setAuthSession(token, data);
        closeAuthModal();
        return true;
      } else {
        localStorage.removeItem("agent_jwt_token");
        localStorage.removeItem("agent_user_name");
        updateAuthUI(null);
        openAuthModal(false);
        return false;
      }
    } catch (e) {
      console.warn("Auth check error:", e);
      openAuthModal(false);
      return false;
    }
  }

  function showPopupLoginError(msg) {
    if (popupAuthSuccessAlert) popupAuthSuccessAlert.classList.add("hidden");
    if (popupAuthErrorMsg) popupAuthErrorMsg.textContent = msg;
    if (popupAuthErrorAlert) popupAuthErrorAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function showPopupLoginSuccess(msg) {
    if (popupAuthErrorAlert) popupAuthErrorAlert.classList.add("hidden");
    if (popupAuthSuccessMsg) popupAuthSuccessMsg.textContent = msg;
    if (popupAuthSuccessAlert) popupAuthSuccessAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function showPopupSignUpError(msg) {
    if (popupSignUpSuccessAlert) popupSignUpSuccessAlert.classList.add("hidden");
    if (popupSignUpErrorMsg) popupSignUpErrorMsg.textContent = msg;
    if (popupSignUpErrorAlert) popupSignUpErrorAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function showPopupSignUpSuccess(msg) {
    if (popupSignUpErrorAlert) popupSignUpErrorAlert.classList.add("hidden");
    if (popupSignUpSuccessMsg) popupSignUpSuccessMsg.textContent = msg;
    if (popupSignUpSuccessAlert) popupSignUpSuccessAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function validateAuthClient(username, password, email, confirmPassword, termsAccepted, isSignUp) {
    const userRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,64}$/;
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!userRegex.test(username)) {
      return "Username must be 3-20 characters (alphanumeric and _ only).";
    }
    if (isSignUp) {
      if (!email || !emailRegex.test(email)) {
        return "Please enter a valid email address.";
      }
      if (!passRegex.test(password)) {
        return "Password requires 8+ chars with uppercase, lowercase, number & symbol (@$!%*?&_#-).";
      }
      if (password !== confirmPassword) {
        return "Passwords do not match.";
      }
      if (!termsAccepted) {
        return "Please agree to the Terms of Service and Privacy Policy.";
      }
    } else {
      if (!password || password.length < 1) {
        return "Password is required.";
      }
    }
    return null;
  }

  if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);

  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) closeAuthModal();
    });
  }

  if (authNavBtn) {
    authNavBtn.addEventListener("click", () => {
      if (currentUser && currentUser.username) {
        if (profileDropdown) profileDropdown.classList.toggle("hidden");
      } else {
        openAuthModal(false);
      }
    });
  }

  if (authModalTriggerBtn) {
    authModalTriggerBtn.addEventListener("click", () => {
      if (profileDropdown) profileDropdown.classList.add("hidden");
      openAuthModal(false);
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      if (profileDropdown) profileDropdown.classList.add("hidden");
      clearAuthSession();
    });
  }

  if (popupSwitchToSignUpBtn) {
    popupSwitchToSignUpBtn.addEventListener("click", () => openAuthModal(true));
  }

  if (popupSwitchToLoginBtn) {
    popupSwitchToLoginBtn.addEventListener("click", () => openAuthModal(false));
  }

  if (popupTogglePasswordBtn && popupPasswordInput) {
    popupTogglePasswordBtn.addEventListener("click", () => {
      const isPwd = popupPasswordInput.getAttribute("type") === "password";
      popupPasswordInput.setAttribute("type", isPwd ? "text" : "password");
      if (popupPasswordEye) {
        popupPasswordEye.setAttribute("data-lucide", isPwd ? "eye-off" : "eye");
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  if (popupForgotPwdBtn) {
    popupForgotPwdBtn.addEventListener("click", () => {
      showPopupLoginError("Reset link sent to registered email. For instant testing, use demo_user / Demo@12345.");
    });
  }

  if (popupAutofillBtn) {
    popupAutofillBtn.addEventListener("click", () => {
      if (popupIdentifierInput) popupIdentifierInput.value = "demo_user";
      if (popupPasswordInput) popupPasswordInput.value = "Demo@12345";
      showToast("Autofilled demo credentials", "info");
    });
  }

  if (popupDemoLoginBtn) {
    popupDemoLoginBtn.addEventListener("click", async () => {
      if (popupLoginSubmitBtn) popupLoginSubmitBtn.disabled = true;
      if (popupLoginSubmitText) popupLoginSubmitText.textContent = "Signing in...";
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "demo_user", password: "Demo@12345" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Demo sign-in failed");

        setAuthSession(data.access_token, data);
        showPopupLoginSuccess("Signed in as Demo Operator!");
        showToast("Signed in as Demo Operator (demo_user)", "success");
        setTimeout(() => {
          closeAuthModal();
        }, 800);
      } catch (err) {
        showPopupLoginError(err.message);
      } finally {
        if (popupLoginSubmitBtn) popupLoginSubmitBtn.disabled = false;
        if (popupLoginSubmitText) popupLoginSubmitText.textContent = "Sign in";
      }
    });
  }

  if (popupLoginForm) {
    popupLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const identifier = (popupIdentifierInput ? popupIdentifierInput.value : "").trim();
      const password = popupPasswordInput ? popupPasswordInput.value : "";

      if (!identifier) {
        showPopupLoginError("Please enter your email or username.");
        return;
      }
      if (!password) {
        showPopupLoginError("Please enter your password.");
        return;
      }

      if (popupLoginSubmitBtn) popupLoginSubmitBtn.disabled = true;
      if (popupLoginSubmitText) popupLoginSubmitText.textContent = "Verifying...";

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier, password: password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Authentication failed");
        }

        setAuthSession(data.access_token, data);
        showPopupLoginSuccess(`Welcome back, ${data.username}! Session active.`);
        showToast(`Welcome back, ${data.username}!`, "success");
        setTimeout(() => {
          closeAuthModal();
        }, 800);
      } catch (err) {
        showPopupLoginError(err.message);
      } finally {
        if (popupLoginSubmitBtn) popupLoginSubmitBtn.disabled = false;
        if (popupLoginSubmitText) popupLoginSubmitText.textContent = "Sign in";
      }
    });
  }

  if (popupSignUpForm) {
    popupSignUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = (popupFullNameInput ? popupFullNameInput.value : "").trim();
      const username = (popupUsernameInput ? popupUsernameInput.value : "").trim();
      const email = (popupEmailInput ? popupEmailInput.value : "").trim();
      const password = popupSignUpPasswordInput ? popupSignUpPasswordInput.value : "";
      const confirmPassword = popupConfirmPasswordInput ? popupConfirmPasswordInput.value : "";
      const termsAccepted = popupTermsCheckbox ? popupTermsCheckbox.checked : false;

      const validationErr = validateAuthClient(username, password, email, confirmPassword, termsAccepted, true);
      if (validationErr) {
        showPopupSignUpError(validationErr);
        return;
      }

      if (popupSignUpSubmitBtn) popupSignUpSubmitBtn.disabled = true;
      if (popupSignUpSubmitText) popupSignUpSubmitText.textContent = "Creating account...";

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            full_name: fullName || username
          })
        });
        const data = await res.json();
        if (!res.ok) {
          let errorText = data.detail;
          if (Array.isArray(data.detail) && data.detail[0]?.msg) {
            errorText = data.detail[0].msg;
          }
          throw new Error(errorText || "Registration failed");
        }

        showPopupSignUpSuccess(`Account created for @${username}! Switching to Sign In...`);
        setTimeout(() => {
          openAuthModal(false);
          if (popupIdentifierInput) popupIdentifierInput.value = username;
          if (popupPasswordInput) popupPasswordInput.value = "";
        }, 1200);
      } catch (err) {
        showPopupSignUpError(err.message);
      } finally {
        if (popupSignUpSubmitBtn) popupSignUpSubmitBtn.disabled = false;
        if (popupSignUpSubmitText) popupSignUpSubmitText.textContent = "Sign up";
      }
    });
  }

  const screen2LoginForm = document.getElementById("screen2LoginForm");
  const screen2IdentifierInput = document.getElementById("screen2IdentifierInput");
  const screen2PasswordInput = document.getElementById("screen2PasswordInput");
  const screen2SubmitBtn = document.getElementById("screen2SubmitBtn");
  const screen2SubmitBtnText = document.getElementById("screen2SubmitBtnText");
  const screen2ErrorAlert = document.getElementById("screen2ErrorAlert");
  const screen2ErrorMsg = document.getElementById("screen2ErrorMsg");
  const screen2SuccessAlert = document.getElementById("screen2SuccessAlert");
  const screen2SuccessMsg = document.getElementById("screen2SuccessMsg");
  const screen2DemoLoginBtn = document.getElementById("screen2DemoLoginBtn");
  const screen2AutofillBtn = document.getElementById("screen2AutofillBtn");
  const screen2TogglePasswordBtn = document.getElementById("screen2TogglePasswordBtn");
  const screen2PasswordEye = document.getElementById("screen2PasswordEye");
  const screen2ForgotPwdBtn = document.getElementById("screen2ForgotPwdBtn");

  function showScreen2Error(msg) {
    if (screen2SuccessAlert) screen2SuccessAlert.classList.add("hidden");
    if (screen2ErrorMsg) screen2ErrorMsg.textContent = msg;
    if (screen2ErrorAlert) screen2ErrorAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function showScreen2Success(msg) {
    if (screen2ErrorAlert) screen2ErrorAlert.classList.add("hidden");
    if (screen2SuccessMsg) screen2SuccessMsg.textContent = msg;
    if (screen2SuccessAlert) screen2SuccessAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  if (screen2TogglePasswordBtn && screen2PasswordInput) {
    screen2TogglePasswordBtn.addEventListener("click", () => {
      const isPwd = screen2PasswordInput.getAttribute("type") === "password";
      screen2PasswordInput.setAttribute("type", isPwd ? "text" : "password");
      if (screen2PasswordEye) {
        screen2PasswordEye.setAttribute("data-lucide", isPwd ? "eye-off" : "eye");
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  if (screen2ForgotPwdBtn) {
    screen2ForgotPwdBtn.addEventListener("click", () => {
      showScreen2Error("Password reset instructions sent. For instant testing, use demo_user / Demo@12345.");
    });
  }

  if (screen2AutofillBtn) {
    screen2AutofillBtn.addEventListener("click", () => {
      if (screen2IdentifierInput) screen2IdentifierInput.value = "demo_user";
      if (screen2PasswordInput) screen2PasswordInput.value = "Demo@12345";
      showToast("Autofilled demo credentials", "info");
    });
  }

  if (screen2DemoLoginBtn) {
    screen2DemoLoginBtn.addEventListener("click", async () => {
      if (screen2SubmitBtn) screen2SubmitBtn.disabled = true;
      if (screen2SubmitBtnText) screen2SubmitBtnText.textContent = "Signing in...";
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "demo_user", password: "Demo@12345" })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Demo login failed");

        setAuthSession(data.access_token, data);
        showScreen2Success("Signed in as Demo Operator! Redirecting to workspace...");
        showToast("Signed in as Demo Operator (demo_user)", "success");
        setTimeout(() => {
          switchView("agents");
        }, 1000);
      } catch (err) {
        showScreen2Error(err.message);
      } finally {
        if (screen2SubmitBtn) screen2SubmitBtn.disabled = false;
        if (screen2SubmitBtnText) screen2SubmitBtnText.textContent = "Sign in";
      }
    });
  }

  if (screen2LoginForm) {
    screen2LoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const identifier = (screen2IdentifierInput ? screen2IdentifierInput.value : "").trim();
      const password = (screen2PasswordInput ? screen2PasswordInput.value : "");

      if (!identifier) {
        showScreen2Error("Please enter your email or username.");
        return;
      }
      if (!password) {
        showScreen2Error("Please enter your password.");
        return;
      }

      if (screen2SubmitBtn) screen2SubmitBtn.disabled = true;
      if (screen2SubmitBtnText) screen2SubmitBtnText.textContent = "Verifying...";

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier, password: password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Authentication failed");
        }

        setAuthSession(data.access_token, data);
        showScreen2Success(`Welcome back, ${data.username}! Redirecting to workspace...`);
        showToast(`Welcome back, ${data.username}! Session active.`, "success");
        setTimeout(() => {
          switchView("agents");
        }, 1000);
      } catch (err) {
        showScreen2Error(err.message);
      } finally {
        if (screen2SubmitBtn) screen2SubmitBtn.disabled = false;
        if (screen2SubmitBtnText) screen2SubmitBtnText.textContent = "Sign in";
      }
    });
  }

  const screen3SignUpForm = document.getElementById("screen3SignUpForm");
  const screen3FullNameInput = document.getElementById("screen3FullNameInput");
  const screen3UsernameInput = document.getElementById("screen3UsernameInput");
  const screen3EmailInput = document.getElementById("screen3EmailInput");
  const screen3PasswordInput = document.getElementById("screen3PasswordInput");
  const screen3ConfirmPasswordInput = document.getElementById("screen3ConfirmPasswordInput");
  const screen3TermsCheckbox = document.getElementById("screen3TermsCheckbox");
  const screen3SubmitBtn = document.getElementById("screen3SubmitBtn");
  const screen3SubmitBtnText = document.getElementById("screen3SubmitBtnText");
  const screen3ErrorAlert = document.getElementById("screen3ErrorAlert");
  const screen3ErrorMsg = document.getElementById("screen3ErrorMsg");
  const screen3SuccessAlert = document.getElementById("screen3SuccessAlert");
  const screen3SuccessMsg = document.getElementById("screen3SuccessMsg");

  function showScreen3Error(msg) {
    if (screen3SuccessAlert) screen3SuccessAlert.classList.add("hidden");
    if (screen3ErrorMsg) screen3ErrorMsg.textContent = msg;
    if (screen3ErrorAlert) screen3ErrorAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  function showScreen3Success(msg) {
    if (screen3ErrorAlert) screen3ErrorAlert.classList.add("hidden");
    if (screen3SuccessMsg) screen3SuccessMsg.textContent = msg;
    if (screen3SuccessAlert) screen3SuccessAlert.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  if (screen3SignUpForm) {
    screen3SignUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = (screen3FullNameInput ? screen3FullNameInput.value : "").trim();
      const username = (screen3UsernameInput ? screen3UsernameInput.value : "").trim();
      const email = (screen3EmailInput ? screen3EmailInput.value : "").trim();
      const password = (screen3PasswordInput ? screen3PasswordInput.value : "");
      const confirmPassword = (screen3ConfirmPasswordInput ? screen3ConfirmPasswordInput.value : "");
      const termsAccepted = screen3TermsCheckbox ? screen3TermsCheckbox.checked : false;

      const validationErr = validateAuthClient(username, password, email, confirmPassword, termsAccepted, true);
      if (validationErr) {
        showScreen3Error(validationErr);
        return;
      }

      if (screen3SubmitBtn) screen3SubmitBtn.disabled = true;
      if (screen3SubmitBtnText) screen3SubmitBtnText.textContent = "Creating account...";

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            full_name: fullName || username
          })
        });
        const data = await res.json();
        if (!res.ok) {
          let errText = data.detail;
          if (Array.isArray(data.detail) && data.detail[0]?.msg) {
            errText = data.detail[0].msg;
          }
          throw new Error(errText || "Registration failed");
        }

        showScreen3Success(`Account created successfully for @${username}! Switching to Sign In...`);
        setTimeout(() => {
          switchView("signin");
          if (screen2IdentifierInput) screen2IdentifierInput.value = username;
          if (screen2PasswordInput) screen2PasswordInput.value = "";
        }, 1300);
      } catch (err) {
        showScreen3Error(err.message);
      } finally {
        if (screen3SubmitBtn) screen3SubmitBtn.disabled = false;
        if (screen3SubmitBtnText) screen3SubmitBtnText.textContent = "Sign up";
      }
    });
  }

  checkAuthStatus();

  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (notificationsDropdown) notificationsDropdown.classList.add("hidden");
      profileDropdown.classList.toggle("hidden");
    });
  }

  if (profileEditLimitBtn) {
    profileEditLimitBtn.addEventListener("click", () => {
      profileDropdown.classList.add("hidden");
      if (customLimitInput) customLimitInput.value = currentSessionLimit;
      guardrailModal.classList.remove("hidden");
    });
  }

  if (resetSessionBtn) {
    resetSessionBtn.addEventListener("click", () => {
      dialogueContainer.innerHTML = `
        <div class="flex items-start gap-3 text-xs leading-relaxed">
          <div class="w-8 h-8 shrink-0 rounded-lg bg-brand-500/10 text-brand-500 flex justify-center items-center">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
          </div>
          <div class="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 max-w-[85%] text-zinc-700 dark:text-zinc-200">
            Welcome! I operate on <strong>Two-Phase Reasoning</strong> with a strict <strong>₹5,000 session bound</strong>. Speak or click a prompt below to initiate purchase or test failure modes.
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      profileDropdown.classList.add("hidden");
      showToast("Local conversation session reset", "info");
    });
  }

  document.addEventListener("click", (e) => {
    if (notificationsDropdown && !notificationsDropdown.contains(e.target) && e.target !== notificationsBtn) {
      notificationsDropdown.classList.add("hidden");
    }
    if (profileDropdown && !profileDropdown.contains(e.target) && e.target !== profileBtn) {
      profileDropdown.classList.add("hidden");
    }
  });

  let cartItems = [
    {
      id: "PROD_PRO_02",
      name: "Autonomous Commerce Pro Tier",
      price_inr: 2499,
      price_paise: 249900,
      in_stock: true,
      icon: "zap"
    }
  ];
  let activeProduct = cartItems[0];
  let currentActiveOrder = null;
  let fullAuditLedger = [];
  let catalogList = [];
  let capturedPayments = [
    {
      payment_id: "pay_mt785iop_jy9tb",
      order_id: "order_rzp_42D42-0002",
      item_id: "PROD_PRO_02",
      item_name: "Autonomous Commerce Pro Tier",
      amount_inr: 2499,
      method: "1-Click Agent Auth",
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  const currentInvoiceNumber = document.getElementById("currentInvoiceNumber");
  const currentInvoiceAmount = document.getElementById("currentInvoiceAmount");
  const currentStatusBadge = document.getElementById("currentStatusBadge");
  const currentPlanName = document.getElementById("currentPlanName");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const copyLinkText = document.getElementById("copyLinkText");

  const headerPayBtn = document.getElementById("headerPayBtn");
  const voiceQuickBtn = document.getElementById("voiceQuickBtn");
  const simulateA2AHeaderBtn = document.getElementById("simulateA2AHeaderBtn");

  const detailOrderId = document.getElementById("detailOrderId");
  const detailDate = document.getElementById("detailDate");
  const cartCountBadge = document.getElementById("cartCountBadge");
  const cartItemsContainer = document.getElementById("cartItemsContainer");

  function getCartTotalInr() {
    return cartItems.reduce((acc, item) => acc + (item.price_inr || 0), 0);
  }

  function renderCart(status = "Open · Verified", orderId = null) {
    const count = cartItems.length;
    const totalInr = getCartTotalInr();

    if (cartCountBadge) {
      cartCountBadge.textContent = count;
      if (count === 0) {
        cartCountBadge.className = "bg-zinc-500/10 text-zinc-500 font-bold px-2 py-0.5 rounded-full text-xs transition";
      } else {
        cartCountBadge.className = "bg-brand-500/10 text-brand-500 font-bold px-2 py-0.5 rounded-full text-xs transition";
      }
    }

    if (sessionBudgetUsage) {
      sessionBudgetUsage.textContent = `₹${totalInr.toLocaleString()} / ₹${currentSessionLimit.toLocaleString()} used`;
    }

    if (cartItemsContainer) {
      if (count === 0) {
        cartItemsContainer.innerHTML = `
          <div class="text-center text-zinc-400 text-xs py-5 px-3 rounded-xl bg-zinc-50/50 border border-dashed border-zinc-200 flex flex-col items-center justify-center gap-1.5 transition">
            <i data-lucide="shopping-cart" class="w-5 h-5 text-zinc-400 opacity-60"></i>
            <span class="font-medium text-zinc-600">Cart is empty</span>
            <span class="text-[11px] text-zinc-400">Select catalog items to add to cart</span>
          </div>
        `;
      } else {
        cartItemsContainer.innerHTML = cartItems.map((item, idx) => `
          <div class="rounded-xl bg-zinc-50 border border-zinc-100 hover:border-brand-500/30 flex px-3 py-2.5 justify-between items-center transition group">
            <div class="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
              <span class="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <i data-lucide="${item.icon || 'zap'}" class="w-3.5 h-3.5"></i>
              </span>
              <span class="truncate text-sm font-medium text-zinc-800" title="${item.name}">${item.name}</span>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              <span class="font-semibold text-sm text-zinc-900 font-mono">₹${item.price_inr.toLocaleString()}</span>
              <button class="remove-cart-item-btn text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer rounded" data-index="${idx}" title="Remove ${item.name}">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        `).join('');

        cartItemsContainer.querySelectorAll(".remove-cart-item-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute("data-index"), 10);
            if (!isNaN(idx) && idx >= 0 && idx < cartItems.length) {
              const removed = cartItems.splice(idx, 1)[0];
              activeProduct = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;
              renderCart();
              updateInvoiceDisplay(activeProduct, null, "Open");
              showToast(`Removed "${removed.name}" from cart`, "info");
            }
          });
        });
      }
    }

    const cartCheckoutContainer = document.getElementById("cartCheckoutContainer");
    const cartCheckoutTotal = document.getElementById("cartCheckoutTotal");
    const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");

    if (cartCheckoutTotal) {
      cartCheckoutTotal.textContent = `₹${totalInr.toLocaleString()}`;
    }
    if (cartCheckoutContainer) {
      if (count === 0) {
        cartCheckoutContainer.classList.add("hidden");
      } else {
        cartCheckoutContainer.classList.remove("hidden");
      }
    }

    if (cartCheckoutBtn) {
      if (totalInr > currentSessionLimit) {
        cartCheckoutBtn.className = "w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer";
        cartCheckoutBtn.innerHTML = `<i data-lucide="shield-alert" class="w-4 h-4 shrink-0"></i><span>🚫 Exceeds Limit (₹${totalInr.toLocaleString()} > ₹${currentSessionLimit.toLocaleString()})</span>`;
      } else if (status.toLowerCase().includes("paid") || status.toLowerCase().includes("settled")) {
        cartCheckoutBtn.className = "w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer";
        cartCheckoutBtn.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4 shrink-0"></i><span>✓ Settled (₹${totalInr.toLocaleString()}) &bull; New Checkout</span>`;
      } else {
        cartCheckoutBtn.className = "w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition cursor-pointer";
        cartCheckoutBtn.innerHTML = `<i data-lucide="credit-card" class="w-4 h-4 shrink-0"></i><span>Checkout ( ₹${totalInr.toLocaleString()} )</span>`;
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function generateUniqueOrderId() {
    const seq = Math.floor(100000 + Math.random() * 900000);
    return `order_rzp_${seq}`;
  }

  const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener("click", () => {
      const totalInr = getCartTotalInr();
      if (totalInr === 0) {
        showToast("Cart is empty. Please select an item to checkout.", "alert");
        return;
      }
      if (totalInr > currentSessionLimit) {
        showToast(`🚫 Guardrail Blocked: Cart total ₹${totalInr.toLocaleString()} exceeds safety limit of ₹${currentSessionLimit.toLocaleString()}`, "alert");
        updateInvoiceDisplay(activeProduct, null, "Blocked · Guardrail");
        appendMessage("assistant", `🛡️ **Guardrail Gate Intercepted:** Total transaction amount **₹${totalInr.toLocaleString()}** exceeds your strict session safety limit of **₹${currentSessionLimit.toLocaleString()}**. Transaction blocked by Pydantic strict bounds.\n\n*Click 'Change' on your session bound in the profile menu or remove items from cart to proceed.*`);
        if (customLimitInput) customLimitInput.value = currentSessionLimit;
        if (guardrailModal) guardrailModal.classList.remove("hidden");
        return;
      }

      const freshOrderId = generateUniqueOrderId();
      triggerRazorpayCheckout({
        order_id: freshOrderId,
        amount_inr: totalInr,
        product_name: cartItems.length === 1 ? cartItems[0].name : `${cartItems.length} Cart Items`
      });
    });
  }

  function updateInvoiceDisplay(prod, orderId = null, status = "Open · Verified") {
    const totalInr = getCartTotalInr();
    const invNum = orderId || (prod ? `#42D42-${prod.id.replace(/[^0-9]/g, '').padStart(4, '0') || '0002'}` : "#42D42-0000");
    const amountStr = `₹${totalInr.toLocaleString()}.00`;

    if (currentInvoiceNumber) currentInvoiceNumber.textContent = invNum;
    if (currentInvoiceAmount) currentInvoiceAmount.textContent = amountStr;
    if (currentPlanName) {
      if (cartItems.length === 0) {
        currentPlanName.textContent = "No Plan Selected (Cart Empty)";
      } else if (cartItems.length === 1) {
        currentPlanName.textContent = cartItems[0].name;
      } else {
        currentPlanName.textContent = `${cartItems[0].name} (+${cartItems.length - 1} more)`;
      }
    }
    if (detailOrderId) detailOrderId.textContent = invNum;
    if (detailDate) detailDate.textContent = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

    if (currentStatusBadge) {
      if (totalInr > currentSessionLimit) {
        currentStatusBadge.className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800";
        currentStatusBadge.textContent = "Blocked · Guardrail";
      } else if (status.toLowerCase().includes("paid") || status.toLowerCase().includes("settled")) {
        currentStatusBadge.className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800";
        currentStatusBadge.textContent = "Paid · Settled";
      } else if (status.toLowerCase().includes("blocked") || status.toLowerCase().includes("failed")) {
        currentStatusBadge.className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800";
        currentStatusBadge.textContent = "Blocked · Guardrail";
      } else if (cartItems.length === 0) {
        currentStatusBadge.className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600";
        currentStatusBadge.textContent = "Cart Empty";
      } else {
        currentStatusBadge.className = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800";
        currentStatusBadge.textContent = "Open · Verified";
      }
    }

    if (headerPayBtn) {
      if (status.toLowerCase().includes("paid") || status.toLowerCase().includes("settled")) {
        headerPayBtn.className = "bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer";
        headerPayBtn.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4"></i> Order Settled · New Order`;
      } else {
        headerPayBtn.className = "bg-brand-500 hover:bg-brand-600 text-white font-medium text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer";
        headerPayBtn.innerHTML = `<i data-lucide="send" class="w-4 h-4"></i> Authorize & Pay`;
      }
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function addToCart(prod) {
    if (!prod) return;
    activeProduct = prod;
    currentActiveOrder = null;
    cartItems.push({ ...prod, instanceId: Date.now() + Math.random() });
    renderCart();
    updateInvoiceDisplay(activeProduct, null, "Open · Verified");
  }

  function updateActiveOrderDisplay(prod, orderId = null, status = "Open · Verified") {
    if (prod) {
      activeProduct = prod;
    }
    renderCart(status, orderId);
    updateInvoiceDisplay(activeProduct, orderId, status);
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href);
      if (copyLinkText) copyLinkText.textContent = "Copied!";
      showToast("Order checkout link copied", "success");
      setTimeout(() => { if (copyLinkText) copyLinkText.textContent = "Copy link"; }, 2000);
    });
  }

  const dialogueContainer = document.getElementById("dialogueContainer");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const waveformContainer = document.getElementById("waveformContainer");
  const orbStateBadge = document.getElementById("orbStateBadge");

  let isProcessing = false;

  function appendMessage(role, text) {
    const msgDiv = document.createElement("div");
    msgDiv.className = "flex items-start gap-3 text-xs leading-relaxed animate-fadeIn";

    const isUser = role === "user";
    const avatar = isUser
      ? '<div class="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 text-blue-500 flex justify-center items-center font-bold text-xs border border-blue-500/20"><i data-lucide="user" class="w-4 h-4"></i></div>'
      : '<div class="w-8 h-8 shrink-0 rounded-lg bg-brand-500/10 text-brand-500 flex justify-center items-center border border-brand-500/20"><i data-lucide="sparkles" class="w-4 h-4"></i></div>';

    let formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formattedText = formattedText.replace(/`([^`]+)`/g, "<code class='bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]'>$1</code>");
    formattedText = formattedText.replace(/\n/g, "<br>");

    const bodyClass = isUser 
      ? "bg-blue-600/15 border border-blue-500/30 text-blue-900 dark:text-blue-100 font-medium shadow-2xs" 
      : "bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200";

    msgDiv.innerHTML = `
      ${avatar}
      <div class="${bodyClass} rounded-xl p-3 max-w-[85%]">
        <p>${formattedText}</p>
      </div>
    `;

    dialogueContainer.appendChild(msgDiv);
    if (window.lucide) window.lucide.createIcons();
    dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
  }

  async function handleUserInteraction(userInput) {
    if (!userInput || isProcessing) return;
    isProcessing = true;

    switchView("agents");
    appendMessage("user", userInput);
    chatInput.value = "";

    try {
      if (orbStateBadge) orbStateBadge.textContent = "PHASE 1: REASONING";

      const reasonResp = await fetch("/api/agent/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userInput })
      });

      const reasonData = await reasonResp.json();
      await fetchAuditTrail();

      appendMessage("assistant", reasonData.message);

      if (reasonData.product) {
        updateActiveOrderDisplay(reasonData.product);
      }

      if (reasonData.action_required !== "EXECUTE_CHECKOUT" || !reasonData.execution_payload) {
        if (orbStateBadge) orbStateBadge.textContent = "PHASE 1: STANDBY";
        isProcessing = false;
        return;
      }

      if (!currentJwtToken) {
        if (orbStateBadge) orbStateBadge.textContent = "AUTH REQUIRED";
        showToast("Authentication required to authorize payment actions", "alert");
        appendMessage("assistant", "🔒 **Authentication Required:** You must be signed in to authorize autonomous money transactions. Opening the secure Sign In popup...");
        openAuthModal(false);
        isProcessing = false;
        return;
      }

      if (orbStateBadge) orbStateBadge.textContent = "PHASE 2: VERIFYING GATEWAY";
      await new Promise(r => setTimeout(r, 400));

      const execResp = await fetch("/api/agent/execute_checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentJwtToken}`
        },
        body: JSON.stringify(reasonData.execution_payload)
      });

      const execData = await execResp.json();
      await fetchAuditTrail();

      if (execResp.status === 401) {
        if (orbStateBadge) orbStateBadge.textContent = "AUTH EXPIRED";
        clearAuthSession();
        openAuthModal(false);
        showToast("Session expired. Please sign in again.", "alert");
        appendMessage("assistant", "⚠️ **Session Expired:** Your authentication token has expired. Please sign in to re-authorize payment execution.");
      } else if (!execResp.ok || execData.status === "blocked_by_guardrail") {
        if (orbStateBadge) orbStateBadge.textContent = "GUARDRAIL BLOCKED";
        updateActiveOrderDisplay(reasonData.product, null, "Blocked");
        showToast("Transaction Blocked: Session limit exceeded", "alert");
        appendMessage("assistant", execData.agent_message || execData.error || `Transaction blocked by ₹${currentSessionLimit.toLocaleString()} session bound.`);
      } else if (execData.status === "rejected") {
        if (orbStateBadge) orbStateBadge.textContent = "REJECTED (OUT OF STOCK)";
        updateActiveOrderDisplay(reasonData.product, null, "Out of Stock");
        showToast("Item out of stock: Graceful failure handled", "alert");
        appendMessage("assistant", execData.agent_remedy_message || execData.reason);
      } else if (execData.status === "success") {
        if (orbStateBadge) orbStateBadge.textContent = "AUTHORIZED";
        updateActiveOrderDisplay(reasonData.product, execData.order_id, "Authorized");
        appendMessage("assistant", `${execData.agent_message}\n\n👉 Click **Checkout** in your Agent Cart or **Authorize & Pay** to complete payment.`);
      }

    } catch (err) {
      console.error(err);
      appendMessage("assistant", `System error: ${err.message}`);
    } finally {
      isProcessing = false;
      setTimeout(() => {
        if (orbStateBadge) orbStateBadge.textContent = "PHASE 1: STANDBY";
      }, 4000);
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", () => handleUserInteraction(chatInput.value.trim()));
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleUserInteraction(chatInput.value.trim());
    });
  }

  document.querySelectorAll(".scenario-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (q) handleUserInteraction(q);
    });
  });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      if (waveformContainer) waveformContainer.classList.remove("opacity-0");
      showToast("Listening for voice instruction...", "info");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleUserInteraction(transcript);
    };

    recognition.onend = () => {
      if (waveformContainer) waveformContainer.classList.add("opacity-0");
    };

    if (voiceBtn) voiceBtn.addEventListener("click", () => { try { recognition.start(); } catch (e) { console.warn(e); } });
    if (voiceQuickBtn) voiceQuickBtn.addEventListener("click", () => { try { recognition.start(); } catch (e) { console.warn(e); } });
  }

  const runA2A = async () => {
    switchView("agents");
    appendMessage("user", "[A2A Protocol Call] Autonomous Buyer Agent 'Agent-AutoBuy-X09' purchasing 'PROD_STARTER_01' (Limit: ₹5,000)...");
    
    try {
      const resp = await fetch("/api/v1/protocol/a2a_checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_agent_id: "Agent-AutoBuy-X09",
          protocol_version: "ACP/2.0-UAP",
          item_id: "PROD_STARTER_01",
          max_budget_paise: currentSessionLimit * 100
        })
      });
      const data = await resp.json();
      await fetchAuditTrail();
      await fetchStats();

      if (resp.ok) {
        updateActiveOrderDisplay({
          id: "PROD_STARTER_01",
          name: "AI Developer Starter Kit",
          price_inr: 499,
          price_paise: 49900,
          in_stock: true
        }, data.order_id, "Paid · Settled");
        showToast(`A2A Order ${data.order_id} settled autonomously!`, "success");
        appendMessage("assistant", `🤖 **A2A Protocol Settled!** Order **${data.order_id}** created for **₹${data.amount_inr}** on behalf of buyer \`${data.buyer_agent_id}\`. Live GMV & settlements updated.`);
      } else {
        showToast("A2A Protocol intercepted", "alert");
        appendMessage("assistant", `A2A Intercepted: ${data.detail || "Refused by guardrail"}`);
      }
    } catch (e) {
      console.error("A2A error:", e);
    }
  };

  const simulateA2ABtn = document.getElementById("simulateA2ABtn");
  if (simulateA2ABtn) simulateA2ABtn.addEventListener("click", runA2A);
  if (simulateA2AHeaderBtn) simulateA2AHeaderBtn.addEventListener("click", runA2A);

  const razorpayGatewayModal = document.getElementById("razorpayGatewayModal");
  const closeGatewayBtn = document.getElementById("closeGatewayBtn");
  const gwOrderAmount = document.getElementById("gwOrderAmount");
  const gwOrderId = document.getElementById("gwOrderId");
  const btnAmountInstant = document.getElementById("btnAmountInstant");
  const btnAmountCard = document.getElementById("btnAmountCard");
  const instantPayBtn = document.getElementById("instantPayBtn");
  const cardPayBtn = document.getElementById("cardPayBtn");
  const upiPayBtn = document.getElementById("upiPayBtn");
  const methodTabs = document.querySelectorAll(".method-tab");
  const tabContents = document.querySelectorAll(".tab-content");

  const paymentResultModal = document.getElementById("paymentResultModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalOrderId = document.getElementById("modalOrderId");
  const modalItemName = document.getElementById("modalItemName");
  const modalAmount = document.getElementById("modalAmount");
  const modalAuditRef = document.getElementById("modalAuditRef");

  methodTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      methodTabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => {
        c.classList.remove("active");
        c.style.display = "none";
      });

      tab.classList.add("active");
      const targetTabId = "tab" + tab.getAttribute("data-tab").charAt(0).toUpperCase() + tab.getAttribute("data-tab").slice(1);
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add("active");
        targetContent.style.display = "block";
      }
    });
  });

  function triggerRazorpayCheckout(orderData) {
    if (orderData.amount_inr > currentSessionLimit) {
      showToast(`🚫 Guardrail Intercepted: Total ₹${orderData.amount_inr.toLocaleString()} exceeds session limit ₹${currentSessionLimit.toLocaleString()}`, "alert");
      updateInvoiceDisplay(activeProduct, null, "Blocked · Guardrail");
      if (customLimitInput) customLimitInput.value = currentSessionLimit;
      if (guardrailModal) guardrailModal.classList.remove("hidden");
      return;
    }
    currentActiveOrder = orderData;
    const formattedAmount = `₹${orderData.amount_inr.toFixed(2)}`;

    gwOrderAmount.textContent = formattedAmount;
    gwOrderId.textContent = orderData.order_id;
    btnAmountInstant.textContent = formattedAmount;
    btnAmountCard.textContent = formattedAmount;

    razorpayGatewayModal.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();
  }

  async function processGatewayPayment(methodName) {
    if (!currentActiveOrder && activeProduct) {
      currentActiveOrder = {
        order_id: `order_rzp_${Date.now().toString().slice(-6)}`,
        amount_inr: getCartTotalInr() || activeProduct.price_inr,
        product_name: cartItems.length === 1 ? cartItems[0].name : (cartItems.length > 1 ? `${cartItems.length} Cart Items` : activeProduct.name)
      };
    }
    const order = currentActiveOrder;
    if (!order) return;

    razorpayGatewayModal.classList.add("hidden");
    const simPaymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    
    try {
      const resp = await fetch("/api/agent/verify_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: order.order_id,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: "simulated_secure_signature",
          amount_inr: order.amount_inr,
          amount_paise: Math.round(order.amount_inr * 100),
          item_id: activeProduct ? activeProduct.id : "PROD_CART",
          item_name: order.product_name || (activeProduct ? activeProduct.name : "Cart Checkout"),
          username: currentUser ? currentUser.username : "demo_user"
        })
      });

      await fetchAuditTrail();
      await fetchStats();

      capturedPayments.unshift({
        payment_id: simPaymentId,
        order_id: order.order_id,
        item_id: activeProduct ? activeProduct.id : "PROD_CART",
        item_name: order.product_name || (activeProduct ? activeProduct.name : "Cart Checkout"),
        amount_inr: order.amount_inr,
        method: methodName,
        timestamp: new Date().toISOString()
      });
      renderPaymentsTable();

      updateActiveOrderDisplay(activeProduct, order.order_id, "Paid · Settled");
      showToast(`Payment of ₹${order.amount_inr.toFixed(2)} captured successfully!`, "success");
      appendMessage("assistant", `✅ **Payment Verified!** Order **${order.order_id}** for **₹${order.amount_inr.toFixed(2)}** successfully settled via ${methodName}. Payment Ref: \`${simPaymentId}\`. Real-time GMV and settlements updated.`);

      modalOrderId.textContent = order.order_id;
      modalItemName.textContent = order.product_name || (activeProduct ? activeProduct.name : "Cart Checkout");
      modalAmount.textContent = `₹${order.amount_inr.toFixed(2)}`;
      modalAuditRef.textContent = simPaymentId;
      paymentResultModal.classList.remove("hidden");

    } catch (err) {
      console.error(err);
      showToast("Payment verification error", "error");
    }
  }

  const cardInputNumber = document.getElementById("cardInputNumber");
  const cardInputExpiry = document.getElementById("cardInputExpiry");
  const cardInputCvv = document.getElementById("cardInputCvv");

  if (cardInputNumber) {
    cardInputNumber.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    });
  }

  if (cardInputExpiry) {
    cardInputExpiry.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (val.length >= 3) {
        e.target.value = `${val.slice(0, 2)} / ${val.slice(2)}`;
      } else {
        e.target.value = val;
      }
    });
  }

  if (cardInputCvv) {
    cardInputCvv.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
    });
  }

  if (instantPayBtn) instantPayBtn.addEventListener("click", () => processGatewayPayment("1-Click Agent Auth"));
  if (cardPayBtn) {
    cardPayBtn.addEventListener("click", () => {
      const rawCard = cardInputNumber ? cardInputNumber.value.trim() : "4111 2222 3333 4444";
      const last4 = rawCard.replace(/\s/g, '').slice(-4) || '4444';
      processGatewayPayment(`Card (•••• ${last4})`);
    });
  }
  if (upiPayBtn) upiPayBtn.addEventListener("click", () => processGatewayPayment("Simulated UPI"));

  if (closeGatewayBtn) {
    closeGatewayBtn.addEventListener("click", () => {
      razorpayGatewayModal.classList.add("hidden");
    });
  }

  if (razorpayGatewayModal) {
    razorpayGatewayModal.addEventListener("click", (e) => {
      if (e.target === razorpayGatewayModal) {
        razorpayGatewayModal.classList.add("hidden");
      }
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", () => paymentResultModal.classList.add("hidden"));

  const closePaymentResultBtn = document.getElementById("closePaymentResultBtn");
  if (closePaymentResultBtn) {
    closePaymentResultBtn.addEventListener("click", () => paymentResultModal.classList.add("hidden"));
  }

  if (paymentResultModal) {
    paymentResultModal.addEventListener("click", (e) => {
      if (e.target === paymentResultModal) {
        paymentResultModal.classList.add("hidden");
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (razorpayGatewayModal) razorpayGatewayModal.classList.add("hidden");
      if (paymentResultModal) paymentResultModal.classList.add("hidden");
      if (guardrailModal) guardrailModal.classList.add("hidden");
      if (authModal) authModal.classList.add("hidden");
    }
  });

  if (headerPayBtn) {
    headerPayBtn.addEventListener("click", () => {
      const totalInr = getCartTotalInr();
      if (totalInr === 0) {
        showToast("Cart is empty. Please select an item to checkout.", "alert");
        return;
      }
      if (totalInr > currentSessionLimit) {
        showToast(`🚫 Guardrail Blocked: Total ₹${totalInr.toLocaleString()} exceeds session limit ₹${currentSessionLimit.toLocaleString()}`, "alert");
        updateInvoiceDisplay(activeProduct, null, "Blocked · Guardrail");
        if (customLimitInput) customLimitInput.value = currentSessionLimit;
        if (guardrailModal) guardrailModal.classList.remove("hidden");
        return;
      }
      const freshOrderId = generateUniqueOrderId();
      triggerRazorpayCheckout({
        order_id: freshOrderId,
        amount_inr: totalInr,
        product_name: cartItems.length === 1 ? cartItems[0].name : `${cartItems.length} Cart Items`
      });
    });
  }

  const auditTimelineContainer = document.getElementById("auditTimelineContainer");
  const auditCounter = document.getElementById("auditCounter");
  const clearAuditBtn = document.getElementById("clearAuditBtn");
  const fullAuditTableBody = document.getElementById("fullAuditTableBody");

  function syncPaymentsFromAudit(ledger) {
    if (!ledger || !Array.isArray(ledger)) return;
    const settledEntries = ledger.filter(e => 
      (e.action === "PAYMENT_CAPTURED" || e.action === "A2A_ORDER_SETTLED") && 
      (e.status === "SUCCESS" || e.guardrail_status === "SETTLED" || e.guardrail_status === "PASSED")
    );
    
    settledEntries.forEach(entry => {
      const orderId = (entry.payload && (entry.payload.razorpay_order_id || entry.payload.id || entry.payload.order_id)) || entry.id;
      const paymentId = (entry.payload && (entry.payload.razorpay_payment_id || entry.payload.receipt)) || entry.id.replace("audit_", "pay_");
      const existing = capturedPayments.find(p => p.order_id === orderId || p.payment_id === paymentId);
      if (!existing && entry.amount_inr) {
        const prod = catalogList.find(p => p.id === entry.item_id);
        capturedPayments.unshift({
          payment_id: paymentId,
          order_id: orderId,
          item_id: entry.item_id || "SKU_SETTLED",
          item_name: prod ? prod.name : (entry.details || "Settled Agent Transaction"),
          amount_inr: entry.amount_inr,
          method: entry.action === "A2A_ORDER_SETTLED" ? "A2A Machine Protocol" : "1-Click Agent Auth",
          timestamp: entry.timestamp || new Date().toISOString()
        });
      }
    });
    renderPaymentsTable();
  }

  async function fetchAuditTrail() {
    try {
      const resp = await fetch("/api/agent/audit_trail");
      const data = await resp.json();
      fullAuditLedger = data.ledger || [];
      renderAuditTimeline(fullAuditLedger);
      renderFullAuditTable(fullAuditLedger);
      syncPaymentsFromAudit(fullAuditLedger);
      if (auditCounter) auditCounter.textContent = `${data.total_entries} Logged Events`;
    } catch (e) {
      console.error(e);
    }
  }

  function renderAuditTimeline(entries) {
    if (!auditTimelineContainer) return;
    auditTimelineContainer.innerHTML = "";
    if (!entries || entries.length === 0) {
      auditTimelineContainer.innerHTML = `<p class="text-xs text-zinc-400">No transactions recorded in audit history.</p>`;
      return;
    }

    entries.forEach((entry, idx) => {
      const isLast = idx === entries.length - 1;
      const timeStr = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
      const dateStr = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "-";

      let nodeColor = "bg-brand-500/10 text-brand-500 border-brand-500/20";
      let iconName = "activity";

      if (entry.status === "SUCCESS" || entry.status === "PASSED" || entry.status === "READY") {
        nodeColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
        iconName = "check-circle";
      } else if (entry.status === "BLOCKED" || entry.status === "FAILED" || entry.status === "ALERT") {
        nodeColor = "bg-red-100 text-red-700 border-red-200";
        iconName = "shield-alert";
      }

      const itemDiv = document.createElement("div");
      itemDiv.className = "flex relative group";

      itemDiv.innerHTML = `
        ${!isLast ? '<div class="absolute top-8 left-4 w-px h-full bg-zinc-200 -ml-px"></div>' : ''}
        <div class="relative z-10 w-8 h-8 ${nodeColor} border rounded-full flex items-center justify-center shrink-0 shadow-2xs">
          <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
        </div>
        <div class="ml-3.5 flex-1 pb-4">
          <div class="flex items-center justify-between">
            <p class="text-xs sm:text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <span>${entry.details}</span>
              ${entry.amount_inr ? `<span class="text-xs font-mono text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md font-bold">₹${entry.amount_inr.toFixed(2)}</span>` : ''}
            </p>
            <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded text-zinc-500 bg-zinc-100 font-medium">${entry.action}</span>
          </div>
          <p class="text-[11px] text-zinc-400 mt-0.5">
            ${dateStr}, ${timeStr} &bull; <span class="text-zinc-600">${entry.phase}</span> ${entry.guardrail_status ? `&bull; <strong class="text-brand-600 font-mono">${entry.guardrail_status}</strong>` : ''}
          </p>
        </div>
      `;

      auditTimelineContainer.appendChild(itemDiv);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  function renderFullAuditTable(entries) {
    if (!fullAuditTableBody) return;
    fullAuditTableBody.innerHTML = "";

    entries.forEach(e => {
      const timeStr = e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-";
      let badge = `<span class="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">${e.status}</span>`;
      if (e.status === "BLOCKED" || e.status === "FAILED") badge = `<span class="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-bold">${e.status}</span>`;

      const tr = document.createElement("tr");
      tr.className = "table-hover-row cursor-pointer border-b border-zinc-100 dark:border-zinc-800/80";
      tr.innerHTML = `
        <td class="p-4 font-mono font-medium">${timeStr}</td>
        <td class="p-4 text-brand-600 font-semibold">${e.phase}</td>
        <td class="p-4 font-bold">${e.action}</td>
        <td class="p-4 font-semibold font-mono">${e.amount_inr ? `₹${e.amount_inr.toFixed(2)}` : '-'}</td>
        <td class="p-4">${badge}</td>
        <td class="p-4 text-xs font-normal">${e.details}</td>
      `;
      fullAuditTableBody.appendChild(tr);
    });
  }

  if (clearAuditBtn) {
    clearAuditBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/agent/clear_audit", { method: "POST" });
        capturedPayments = [];
        await fetchAuditTrail();
        await fetchStats();
        showToast("Audit history & telemetry re-initialized", "success");
      } catch (e) {
        console.error(e);
      }
    });
  }

  const productsGrid = document.getElementById("productsGrid");
  const catalogFullGrid = document.getElementById("catalogFullGrid");
  const catalogCount = document.getElementById("catalogCount");

  async function fetchCatalog() {
    try {
      const resp = await fetch("/api/catalog");
      const data = await resp.json();
      catalogList = data.catalog || [];
      renderMiniCatalog(catalogList);
      renderFullCatalog(catalogList);
    } catch (e) {
      console.error(e);
    }
  }

  function renderMiniCatalog(products) {
    if (!productsGrid) return;
    productsGrid.innerHTML = "";
    if (catalogCount) catalogCount.textContent = `${products.length} Items`;

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "rounded-xl bg-zinc-50 border border-zinc-100 hover:border-brand-500/30 flex p-3 items-center gap-3 transition cursor-pointer group";

      let iconBg = "bg-brand-500/10 text-brand-500";
      if (!p.in_stock) iconBg = "bg-red-100 text-red-600";

      card.innerHTML = `
        <div class="w-9 h-9 rounded-lg ${iconBg} flex justify-center items-center shrink-0 font-bold text-sm">
          <i data-lucide="${p.icon || 'package'}" class="w-4 h-4"></i>
        </div>
        <div class="min-w-0 flex-1">
          <span class="block font-medium text-sm text-zinc-900 group-hover:text-brand-600 transition truncate">${p.name}</span>
          <span class="text-zinc-500 text-xs font-mono">₹${p.price_inr.toLocaleString()} &middot; ${p.in_stock ? 'In Stock' : 'Out of Stock'}</span>
        </div>
        <button class="text-brand-500 hover:text-brand-600 font-semibold text-xs py-1 px-2 rounded-lg bg-white border border-zinc-200">
          Select
        </button>
      `;

      card.addEventListener("click", () => {
        addToCart(p);
        showToast(`Added "${p.name}" to cart`, "success");
      });

      productsGrid.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function renderFullCatalog(products) {
    if (!catalogFullGrid) return;
    catalogFullGrid.innerHTML = "";

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-500 transition";
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start mb-4">
            <div class="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <i data-lucide="${p.icon || 'package'}" class="w-5 h-5"></i>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700">${p.badge}</span>
          </div>
          <h4 class="font-bold text-base text-zinc-900">${p.name}</h4>
          <p class="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed">${p.description}</p>
        </div>
        <div class="pt-4 border-t border-zinc-100 flex justify-between items-center">
          <div>
            <span class="text-[11px] text-zinc-400 block">Price</span>
            <span class="text-base font-bold text-zinc-900 font-mono">₹${p.price_inr.toLocaleString()}</span>
          </div>
          <button class="buy-full-btn bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer">
            Add to Cart
          </button>
        </div>
      `;

      card.querySelector(".buy-full-btn").addEventListener("click", () => {
        addToCart(p);
        switchView("agents");
        showToast(`Added "${p.name}" to cart`, "success");
      });

      catalogFullGrid.appendChild(card);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  const paymentsTableBody = document.getElementById("paymentsTableBody");
  function renderPaymentsTable() {
    if (!paymentsTableBody) return;
    paymentsTableBody.innerHTML = "";

    capturedPayments.forEach(p => {
      const timeStr = new Date(p.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const tr = document.createElement("tr");
      tr.className = "table-hover-row cursor-pointer border-b border-zinc-100 dark:border-zinc-800/80";
      tr.innerHTML = `
        <td class="p-4 text-brand-600 font-bold font-mono">${p.payment_id}</td>
        <td class="p-4 font-mono">${p.order_id}</td>
        <td class="p-4 font-sans font-medium">${p.item_name}</td>
        <td class="p-4 text-emerald-600 font-bold font-mono">₹${Number(p.amount_inr || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td class="p-4"><span class="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">SETTLED (TEST)</span></td>
        <td class="p-4 text-xs">${p.method} &bull; ${timeStr}</td>
      `;
      paymentsTableBody.appendChild(tr);
    });
  }

  const statGMV = document.getElementById("statGMV");
  const statOrders = document.getElementById("statOrders");
  const statBlocks = document.getElementById("statBlocks");
  const statA2A = document.getElementById("statA2A");

  async function fetchStats() {
    try {
      const resp = await fetch("/api/agent/stats");
      const data = await resp.json();
      if (statGMV) statGMV.textContent = `₹${Number(data.total_gmv_inr || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      if (statOrders) statOrders.textContent = `${data.orders_created} ${data.orders_created === 1 ? 'Order' : 'Orders'}`;
      if (statBlocks) statBlocks.textContent = `${data.guardrail_blocks_intercepted} ${data.guardrail_blocks_intercepted === 1 ? 'Block' : 'Blocks'}`;
      if (statA2A) statA2A.textContent = `${data.a2a_ai_buyer_requests} ${data.a2a_ai_buyer_requests === 1 ? 'Machine Call' : 'Machine Calls'}`;
    } catch (e) {
      console.error(e);
    }
  }

  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      const invNum = currentInvoiceNumber ? currentInvoiceNumber.textContent : "#42D42-0002";
      const totalInr = getCartTotalInr();
      const amountStr = `₹${totalInr.toLocaleString()}.00`;
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      let itemsRowsHtml = "";
      if (cartItems.length === 0) {
        itemsRowsHtml = `<tr><td colspan="5" style="text-align: center; color: #9ca3af; padding: 16px;">No items in cart</td></tr>`;
      } else {
        cartItems.forEach(item => {
          itemsRowsHtml += `
            <tr>
              <td><strong>${item.name}</strong></td>
              <td style="font-family: monospace;">${item.id}</td>
              <td>1</td>
              <td>₹${item.price_inr.toLocaleString()}.00</td>
              <td style="text-align: right; font-weight: 700;">₹${item.price_inr.toLocaleString()}.00</td>
            </tr>
          `;
        });
      }

      let auditRowsHtml = "";
      (fullAuditLedger || []).slice(0, 8).forEach(entry => {
        const time = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "-";
        auditRowsHtml += `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">${time}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 600;">${entry.action}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #10b981; font-weight: 600;">${entry.status}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #374151;">${entry.details}</td>
          </tr>
        `;
      });

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Please allow popups to print/download invoice PDF.");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - ${invNum}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111827; margin: 0; padding: 20px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2b7fff; padding-bottom: 20px; margin-bottom: 24px; }
            .brand-title { font-size: 22px; font-weight: 800; color: #111827; }
            .inv-title { font-size: 26px; font-weight: 800; color: #2b7fff; text-align: right; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
            .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; border-bottom: 1px solid #d1d5db; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            .totals-wrap { display: flex; justify-content: flex-end; }
            .totals-box { width: 260px; }
            .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
            .total-row.grand { border-top: 2px solid #111827; font-weight: 800; font-size: 16px; margin-top: 6px; padding-top: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand-title">Razorpay AI_Payhelper</div>
              <div style="font-size: 12px; color: #6b7280;">Autonomous Bounded Checkout Gateway</div>
            </div>
            <div>
              <div class="inv-title">INVOICE</div>
              <div style="font-size: 12px; color: #4b5563;">Ref: <strong>${invNum}</strong></div>
              <div style="font-size: 12px; color: #4b5563;">Date: ${dateStr}</div>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-box">
              <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Customer</div>
              <div style="font-weight: 600;">Claud Newton</div>
              <div style="font-size: 12px; color: #4b5563;">claudnew@gmail.com</div>
            </div>
            <div class="info-box">
              <div style="font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase;">Protocol & Safety</div>
              <div style="font-weight: 600;">ACP/2.0-UAP Verified</div>
              <div style="font-size: 12px; color: #4b5563;">Session Limit: &le; ₹${currentSessionLimit.toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Description</th><th>SKU</th><th>Qty</th><th>Price</th><th style="text-align: right;">Total</th></tr></thead>
            <tbody>${itemsRowsHtml}</tbody>
          </table>
          <div class="totals-wrap"><div class="totals-box"><div class="total-row grand"><span>Total Paid</span><span>${amountStr}</span></div></div></div>
          <div class="footer">Razorpay Agentic Commerce 2026 &bull; Pydantic Bounded & Gated Execution</div>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 250); };</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    });
  }

  fetchCatalog();
  fetchAuditTrail();
  fetchStats();
  updateActiveOrderDisplay(activeProduct);
});
