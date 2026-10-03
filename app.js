/**
 * TASKFLOW - AUTHENTICATION CONTROLLER (app.js)
 * Clean, robust authentication logic for index.html:
 * - Login validation & redirect to dashboard.html
 * - Create account validation (Name, Mail, DOB, Mobile, Password) & redirect
 * - Password visibility toggle
 * - Dynamic password strength meter
 * - Forgot password modal
 * - Demo account autofill
 * - Theme switcher with persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // INITIAL DATA & STORAGE
  // ==========================================================================

  const DEFAULT_DEMO_USER = {
    id: 'user_demo_01',
    name: 'Alex Morgan',
    email: 'alex@taskflow.io',
    password: 'Task1234!',
    dob: '1998-05-15',
    mobile: '+91 98765 43210',
    createdAt: new Date().toISOString()
  };

  function initStorage() {
    if (!localStorage.getItem('taskflow_users')) {
      localStorage.setItem('taskflow_users', JSON.stringify([DEFAULT_DEMO_USER]));
    }
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('taskflow_users')) || [];
    } catch {
      return [DEFAULT_DEMO_USER];
    }
  }

  function saveUsers(users) {
    localStorage.setItem('taskflow_users', JSON.stringify(users));
  }

  function setCurrentUser(user, remember = false) {
    if (remember) {
      localStorage.setItem('taskflow_active_user', JSON.stringify(user));
      sessionStorage.removeItem('taskflow_active_user');
    } else {
      sessionStorage.setItem('taskflow_active_user', JSON.stringify(user));
      localStorage.removeItem('taskflow_active_user');
    }
  }

  // ==========================================================================
  // DOM REFERENCES
  // ==========================================================================

  const toastContainer = document.getElementById('toast-container');
  const themeToggle = document.getElementById('theme-toggle');

  // Tabs
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const tabIndicator = document.getElementById('tab-indicator');
  const loginFormPanel = document.getElementById('login-form-panel');
  const registerFormPanel = document.getElementById('register-form-panel');
  const switchToRegisterBtn = document.getElementById('switch-to-register');
  const switchToLoginBtn = document.getElementById('switch-to-login');

  // Login Form
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginRemember = document.getElementById('login-remember');
  const loginEmailError = document.getElementById('login-email-error');
  const loginPasswordError = document.getElementById('login-password-error');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnFillDemo = document.getElementById('btn-fill-demo');

  // Register Form
  const registerForm = document.getElementById('register-form');
  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regDob = document.getElementById('reg-dob');
  const regMobile = document.getElementById('reg-mobile');
  const regPassword = document.getElementById('reg-password');
  const regTerms = document.getElementById('reg-terms');
  const regNameError = document.getElementById('reg-name-error');
  const regEmailError = document.getElementById('reg-email-error');
  const regDobError = document.getElementById('reg-dob-error');
  const regMobileError = document.getElementById('reg-mobile-error');
  const regPasswordError = document.getElementById('reg-password-error');
  const regTermsError = document.getElementById('reg-terms-error');
  const btnRegisterSubmit = document.getElementById('btn-register-submit');

  // Password Strength
  const meterBars = [
    document.getElementById('meter-1'),
    document.getElementById('meter-2'),
    document.getElementById('meter-3'),
    document.getElementById('meter-4')
  ];
  const meterText = document.getElementById('meter-text');

  // Forgot Password Modal
  const linkForgotPass = document.getElementById('link-forgot-pass');
  const forgotModal = document.getElementById('forgot-modal');
  const btnCloseForgotModal = document.getElementById('btn-close-forgot-modal');
  const btnCancelForgot = document.getElementById('btn-cancel-forgot');
  const forgotForm = document.getElementById('forgot-form');
  const forgotEmail = document.getElementById('forgot-email');
  const forgotEmailError = document.getElementById('forgot-email-error');

  // Set DOB max date
  if (regDob) {
    const todayStr = new Date().toISOString().split('T')[0];
    regDob.setAttribute('max', todayStr);
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================

  function showToast(message, type = 'info', duration = 3500) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-msg">${message}</div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(60px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // ==========================================================================
  // THEME SWITCHER
  // ==========================================================================

  function applySavedTheme() {
    const savedTheme = localStorage.getItem('taskflow_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
  }

  function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('taskflow_theme', 'light');
      showToast('Switched to Light Theme', 'info', 1800);
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('taskflow_theme', 'dark');
      showToast('Switched to Dark Theme', 'info', 1800);
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // ==========================================================================
  // TAB NAVIGATION (LOGIN <=> REGISTER)
  // ==========================================================================

  function switchTab(target) {
    if (target === 'login') {
      if (tabLogin) {
        tabLogin.classList.add('active');
        tabLogin.setAttribute('aria-selected', 'true');
      }
      if (tabRegister) {
        tabRegister.classList.remove('active');
        tabRegister.setAttribute('aria-selected', 'false');
      }
      if (tabIndicator) {
        tabIndicator.style.transform = 'translateX(0)';
      }
      if (loginFormPanel) loginFormPanel.classList.add('active');
      if (registerFormPanel) registerFormPanel.classList.remove('active');
    } else {
      if (tabRegister) {
        tabRegister.classList.add('active');
        tabRegister.setAttribute('aria-selected', 'true');
      }
      if (tabLogin) {
        tabLogin.classList.remove('active');
        tabLogin.setAttribute('aria-selected', 'false');
      }
      if (tabIndicator) {
        tabIndicator.style.transform = 'translateX(100%)';
      }
      if (registerFormPanel) registerFormPanel.classList.add('active');
      if (loginFormPanel) loginFormPanel.classList.remove('active');
    }
    clearErrors();
  }

  if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
  if (tabRegister) tabRegister.addEventListener('click', () => switchTab('register'));
  if (switchToRegisterBtn) switchToRegisterBtn.addEventListener('click', () => switchTab('register'));
  if (switchToLoginBtn) switchToLoginBtn.addEventListener('click', () => switchTab('login'));

  // ==========================================================================
  // PASSWORD VISIBILITY TOGGLE
  // ==========================================================================

  document.querySelectorAll('.btn-toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;
      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.classList.add('hidden');
        if (eyeClosed) eyeClosed.classList.remove('hidden');
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.classList.remove('hidden');
        if (eyeClosed) eyeClosed.classList.add('hidden');
        btn.setAttribute('aria-label', 'Show password');
      }
    });
  });

  // ==========================================================================
  // PASSWORD STRENGTH ANALYZER
  // ==========================================================================

  if (regPassword) {
    regPassword.addEventListener('input', () => {
      const val = regPassword.value;
      let score = 0;

      if (!val) {
        meterBars.forEach(bar => {
          if (bar) bar.style.backgroundColor = 'var(--border-subtle)';
        });
        if (meterText) {
          meterText.textContent = 'Strength: enter password';
          meterText.style.color = 'var(--text-muted)';
        }
        return;
      }

      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const colors = {
        1: '#ef4444',
        2: '#f59e0b',
        3: '#3b82f6',
        4: '#10b981'
      };

      const labels = {
        1: 'Weak (add numbers & symbols)',
        2: 'Fair (add uppercase & special chars)',
        3: 'Good password',
        4: 'Strong & secure password!'
      };

      meterBars.forEach((bar, index) => {
        if (bar) {
          bar.style.backgroundColor = index < score ? colors[score] : 'var(--border-subtle)';
        }
      });

      if (meterText) {
        meterText.textContent = `Strength: ${labels[score] || 'Too short'}`;
        meterText.style.color = colors[score] || 'var(--text-muted)';
      }
    });
  }

  // ==========================================================================
  // VALIDATION UTILITIES
  // ==========================================================================

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  function isValidPhone(phone) {
    const cleanDigits = phone.replace(/\D/g, '');
    return cleanDigits.length >= 10 && cleanDigits.length <= 15;
  }

  function setFieldError(inputEl, errorEl, message) {
    if (inputEl) {
      inputEl.classList.add('input-error');
      inputEl.classList.remove('input-valid');
    }
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('input-error');
      if (inputEl.value && inputEl.value.trim().length > 0) {
        inputEl.classList.add('input-valid');
      } else {
        inputEl.classList.remove('input-valid');
      }
    }
    if (errorEl) errorEl.textContent = '';
  }

  function clearErrors() {
    document.querySelectorAll('.form-input').forEach(el => {
      el.classList.remove('input-error', 'input-valid');
    });
    document.querySelectorAll('.field-error').forEach(el => {
      el.textContent = '';
    });
  }

  if (loginEmail) loginEmail.addEventListener('input', () => clearFieldError(loginEmail, loginEmailError));
  if (loginPassword) loginPassword.addEventListener('input', () => clearFieldError(loginPassword, loginPasswordError));
  if (regName) regName.addEventListener('input', () => clearFieldError(regName, regNameError));
  if (regEmail) regEmail.addEventListener('input', () => clearFieldError(regEmail, regEmailError));
  if (regDob) regDob.addEventListener('change', () => clearFieldError(regDob, regDobError));
  if (regMobile) regMobile.addEventListener('input', () => clearFieldError(regMobile, regMobileError));
  if (regPassword) regPassword.addEventListener('input', () => clearFieldError(regPassword, regPasswordError));
  if (regTerms) regTerms.addEventListener('change', () => { if (regTerms.checked && regTermsError) regTermsError.textContent = ''; });

  // ==========================================================================
  // QUICK DEMO FILL
  // ==========================================================================

  if (btnFillDemo) {
    btnFillDemo.addEventListener('click', () => {
      switchTab('login');
      if (loginEmail) loginEmail.value = 'alex@taskflow.io';
      if (loginPassword) loginPassword.value = 'Task1234!';
      clearErrors();
      showToast('Auto-filled Demo credentials! Click "Sign In" to continue.', 'info');
    });
  }

  // ==========================================================================
  // LOGIN SUBMIT
  // ==========================================================================

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      const email = loginEmail ? loginEmail.value.trim() : '';
      const password = loginPassword ? loginPassword.value : '';
      let isValid = true;

      if (!email) {
        setFieldError(loginEmail, loginEmailError, 'Email address is required.');
        isValid = false;
      } else if (!isValidEmail(email)) {
        setFieldError(loginEmail, loginEmailError, 'Please enter a valid email address.');
        isValid = false;
      }

      if (!password) {
        setFieldError(loginPassword, loginPasswordError, 'Password is required.');
        isValid = false;
      } else if (password.length < 6) {
        setFieldError(loginPassword, loginPasswordError, 'Password must be at least 6 characters.');
        isValid = false;
      }

      if (!isValid) return;

      const btnText = btnLoginSubmit ? btnLoginSubmit.querySelector('.btn-text') : null;
      const btnLoader = btnLoginSubmit ? btnLoginSubmit.querySelector('.btn-loader') : null;
      if (btnText) btnText.classList.add('hidden');
      if (btnLoader) btnLoader.classList.remove('hidden');
      if (btnLoginSubmit) btnLoginSubmit.disabled = true;

      setTimeout(() => {
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
        if (btnLoginSubmit) btnLoginSubmit.disabled = false;

        const users = getUsers();
        const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (matchedUser) {
          const remember = loginRemember ? loginRemember.checked : true;
          setCurrentUser(matchedUser, remember);
          showToast(`Welcome back, ${matchedUser.name}! Opening Dashboard...`, 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 400);
        } else {
          setFieldError(loginPassword, loginPasswordError, 'Invalid email or password. Please try again.');
          showToast('Authentication failed: Invalid credentials.', 'error');
        }
      }, 500);
    });
  }

  // ==========================================================================
  // REGISTER SUBMIT
  // ==========================================================================

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();

      const name = regName ? regName.value.trim() : '';
      const email = regEmail ? regEmail.value.trim() : '';
      const dob = regDob ? regDob.value : '';
      const mobile = regMobile ? regMobile.value.trim() : '';
      const password = regPassword ? regPassword.value : '';
      const termsAccepted = regTerms ? regTerms.checked : false;

      let isValid = true;

      // Validate Name
      if (!name) {
        setFieldError(regName, regNameError, 'Full name is required.');
        isValid = false;
      } else if (name.length < 2) {
        setFieldError(regName, regNameError, 'Name must be at least 2 characters.');
        isValid = false;
      }

      // Validate Email
      if (!email) {
        setFieldError(regEmail, regEmailError, 'Email address is required.');
        isValid = false;
      } else if (!isValidEmail(email)) {
        setFieldError(regEmail, regEmailError, 'Please enter a valid email address.');
        isValid = false;
      } else {
        const users = getUsers();
        const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
          setFieldError(regEmail, regEmailError, 'An account with this email already exists.');
          isValid = false;
        }
      }

      // Validate DOB
      if (!dob) {
        setFieldError(regDob, regDobError, 'Date of birth is required.');
        isValid = false;
      } else {
        const birthDate = new Date(dob);
        const today = new Date();
        if (birthDate > today) {
          setFieldError(regDob, regDobError, 'Date of birth cannot be in the future.');
          isValid = false;
        }
      }

      // Validate Mobile
      if (!mobile) {
        setFieldError(regMobile, regMobileError, 'Mobile number is required.');
        isValid = false;
      } else if (!isValidPhone(mobile)) {
        setFieldError(regMobile, regMobileError, 'Please enter a valid 10-digit mobile number.');
        isValid = false;
      }

      // Validate Password
      if (!password) {
        setFieldError(regPassword, regPasswordError, 'Password is required.');
        isValid = false;
      } else if (password.length < 8) {
        setFieldError(regPassword, regPasswordError, 'Password must be at least 8 characters.');
        isValid = false;
      }

      // Validate Terms
      if (!termsAccepted) {
        if (regTermsError) regTermsError.textContent = 'You must agree to the Terms & Privacy Policy.';
        isValid = false;
      }

      if (!isValid) return;

      const btnText = btnRegisterSubmit ? btnRegisterSubmit.querySelector('.btn-text') : null;
      const btnLoader = btnRegisterSubmit ? btnRegisterSubmit.querySelector('.btn-loader') : null;
      if (btnText) btnText.classList.add('hidden');
      if (btnLoader) btnLoader.classList.remove('hidden');
      if (btnRegisterSubmit) btnRegisterSubmit.disabled = true;

      setTimeout(() => {
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
        if (btnRegisterSubmit) btnRegisterSubmit.disabled = false;

        const newUser = {
          id: 'user_' + Date.now(),
          name,
          email,
          password,
          dob,
          mobile,
          createdAt: new Date().toISOString()
        };

        const users = getUsers();
        users.push(newUser);
        saveUsers(users);

        setCurrentUser(newUser, true);
        showToast('Account created! Opening Dashboard...', 'success');
        registerForm.reset();
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 400);
      }, 500);
    });
  }

  // ==========================================================================
  // FORGOT PASSWORD MODAL
  // ==========================================================================

  if (linkForgotPass && forgotModal) {
    linkForgotPass.addEventListener('click', (e) => {
      e.preventDefault();
      forgotModal.classList.remove('hidden');
      if (forgotEmail && loginEmail) forgotEmail.value = loginEmail.value || '';
      if (forgotEmailError) forgotEmailError.textContent = '';
    });
  }

  function closeForgotModal() {
    if (forgotModal) forgotModal.classList.add('hidden');
  }

  if (btnCloseForgotModal) btnCloseForgotModal.addEventListener('click', closeForgotModal);
  if (btnCancelForgot) btnCancelForgot.addEventListener('click', closeForgotModal);
  if (forgotModal) {
    forgotModal.addEventListener('click', (e) => {
      if (e.target === forgotModal) closeForgotModal();
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = forgotEmail ? forgotEmail.value.trim() : '';
      if (!email || !isValidEmail(email)) {
        if (forgotEmailError) forgotEmailError.textContent = 'Please provide a valid registered email.';
        return;
      }

      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (user) {
        closeForgotModal();
        showToast(`Reset instructions sent! (Demo Password: ${user.password})`, 'success', 6000);
      } else {
        if (forgotEmailError) forgotEmailError.textContent = 'No account found with this email.';
      }
    });
  }

  // ==========================================================================
  // INITIALIZE
  // ==========================================================================

  initStorage();
  applySavedTheme();

  // If already logged in, show helpful banner
  const activeUser = localStorage.getItem('taskflow_active_user') || sessionStorage.getItem('taskflow_active_user');
  if (activeUser) {
    try {
      const u = JSON.parse(activeUser);
      showToast(`Logged in as ${u.name}. <a href="dashboard.html" style="color:#6366f1;font-weight:700;text-decoration:underline;margin-left:4px;">Go to Dashboard →</a>`, 'info', 5000);
    } catch {}
  }
});
