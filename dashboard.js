/**
 * TASKFLOW - USER ACCOUNT & PROFILE DASHBOARD CONTROLLER (dashboard.js)
 * Features:
 * - Robust authentication verification with demo fallback
 * - Displays registered user credentials: Name, Email (Mail), Date of Birth, Mobile Number
 * - Profile Edit Modal with instant validation & localStorage sync
 * - Theme switcher (Dark / Light)
 * - Sign Out handler
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // AUTHENTICATION GUARD & SESSION RESOLUTION
  // ==========================================================================

  function getActiveUser() {
    const sessionData = sessionStorage.getItem('taskflow_active_user');
    if (sessionData) {
      try { return JSON.parse(sessionData); } catch {}
    }
    const localData = localStorage.getItem('taskflow_active_user');
    if (localData) {
      try { return JSON.parse(localData); } catch {}
    }
    return null;
  }

  let currentUser = getActiveUser();

  // If not authenticated, gracefully fall back to first registered user or demo user
  if (!currentUser) {
    try {
      const allUsers = JSON.parse(localStorage.getItem('taskflow_users')) || [];
      currentUser = allUsers[0] || {
        id: 'user_demo_01',
        name: 'Alex Morgan',
        email: 'alex@taskflow.io',
        dob: '1998-05-15',
        mobile: '+91 98765 43210'
      };
      if (!localStorage.getItem('taskflow_users')) {
        localStorage.setItem('taskflow_users', JSON.stringify([currentUser]));
      }
      localStorage.setItem('taskflow_active_user', JSON.stringify(currentUser));
    } catch {
      currentUser = {
        id: 'user_demo_01',
        name: 'Alex Morgan',
        email: 'alex@taskflow.io',
        dob: '1998-05-15',
        mobile: '+91 98765 43210'
      };
    }
  }

  function saveActiveUser(user) {
    if (localStorage.getItem('taskflow_active_user')) {
      localStorage.setItem('taskflow_active_user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('taskflow_active_user', JSON.stringify(user));
    }

    // Also update in all users registry
    try {
      const allUsers = JSON.parse(localStorage.getItem('taskflow_users')) || [];
      const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (userIndex !== -1) {
        allUsers[userIndex] = { ...allUsers[userIndex], ...user };
        localStorage.setItem('taskflow_users', JSON.stringify(allUsers));
      }
    } catch {}
  }

  // ==========================================================================
  // DOM REFERENCES
  // ==========================================================================

  const toastContainer = document.getElementById('toast-container');

  // Sidebar
  const dashSidebar = document.getElementById('dash-sidebar');
  const sidebarOpenBtn = document.getElementById('sidebar-open-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebarUserName = document.getElementById('sidebar-user-name');
  const sidebarUserEmail = document.getElementById('sidebar-user-email');
  const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');
  const btnSidebarLogout = document.getElementById('btn-sidebar-logout');

  // Header
  const headerUserName = document.getElementById('header-user-name');
  const headerUserAvatar = document.getElementById('header-user-avatar');
  const headerUserBtn = document.getElementById('header-user-btn');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');
  const dropUserName = document.getElementById('drop-user-name');
  const dropUserEmail = document.getElementById('drop-user-email');
  const dropEditProfileBtn = document.getElementById('drop-edit-profile-btn');
  const btnHeaderLogout = document.getElementById('btn-header-logout');
  const headerThemeToggle = document.getElementById('header-theme-toggle');
  const btnOpenEditProfile = document.getElementById('btn-open-edit-profile');

  // Hero Banner
  const heroDisplayName = document.getElementById('hero-display-name');
  const heroChipEmail = document.getElementById('hero-chip-email');
  const heroChipMobile = document.getElementById('hero-chip-mobile');
  const heroChipDob = document.getElementById('hero-chip-dob');
  const btnHeroEditProfile = document.getElementById('btn-hero-edit-profile');
  const metricSessionTime = document.getElementById('metric-session-time');

  // Personal Info Card
  const profileCardAvatar = document.getElementById('profile-card-avatar');
  const profileCardName = document.getElementById('profile-card-name');
  const profileCardNameVal = document.getElementById('profile-card-name-val');
  const profileCardEmail = document.getElementById('profile-card-email');
  const profileCardMobile = document.getElementById('profile-card-mobile');
  const profileCardDob = document.getElementById('profile-card-dob');
  const btnCardEditProfile = document.getElementById('btn-card-edit-profile');
  const btnCardLogout = document.getElementById('btn-card-logout');

  // Edit Profile Modal
  const editProfileModal = document.getElementById('edit-profile-modal');
  const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
  const btnCancelProfileModal = document.getElementById('btn-cancel-profile-modal');
  const editProfileForm = document.getElementById('edit-profile-form');
  const editName = document.getElementById('edit-name');
  const editEmail = document.getElementById('edit-email');
  const editDob = document.getElementById('edit-dob');
  const editMobile = document.getElementById('edit-mobile');

  // ==========================================================================
  // TOAST NOTIFICATIONS
  // ==========================================================================

  function showToast(message, type = 'info', duration = 3200) {
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
  // RENDER USER PROFILE
  // ==========================================================================

  function renderProfile() {
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'User';
    const initials = currentUser.name
      ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'US';

    // Sidebar
    if (sidebarUserName) sidebarUserName.textContent = currentUser.name || 'User';
    if (sidebarUserEmail) sidebarUserEmail.textContent = currentUser.email || 'user@taskflow.io';
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = initials;

    // Header
    if (headerUserName) headerUserName.textContent = firstName;
    if (headerUserAvatar) headerUserAvatar.textContent = initials;
    if (dropUserName) dropUserName.textContent = currentUser.name || 'User';
    if (dropUserEmail) dropUserEmail.textContent = currentUser.email || 'user@taskflow.io';

    // Hero Banner
    if (heroDisplayName) heroDisplayName.textContent = firstName;
    if (heroChipEmail) heroChipEmail.textContent = currentUser.email || 'user@taskflow.io';
    if (heroChipMobile) heroChipMobile.textContent = currentUser.mobile || 'Not provided';
    if (heroChipDob) heroChipDob.textContent = currentUser.dob || 'Not provided';

    // Personal Details Card
    if (profileCardAvatar) profileCardAvatar.textContent = initials;
    if (profileCardName) profileCardName.textContent = currentUser.name || 'User';
    if (profileCardNameVal) profileCardNameVal.textContent = currentUser.name || 'User';
    if (profileCardEmail) profileCardEmail.textContent = currentUser.email || 'user@taskflow.io';
    if (profileCardMobile) profileCardMobile.textContent = currentUser.mobile || 'Not provided';
    if (profileCardDob) profileCardDob.textContent = currentUser.dob || 'Not provided';

    // Session time indicator
    if (metricSessionTime) {
      const now = new Date();
      metricSessionTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  // ==========================================================================
  // EDIT PROFILE MODAL
  // ==========================================================================

  function openEditModal() {
    if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
    if (editName) editName.value = currentUser.name || '';
    if (editEmail) editEmail.value = currentUser.email || '';
    if (editDob) editDob.value = currentUser.dob || '';
    if (editMobile) editMobile.value = currentUser.mobile || '';
    if (editProfileModal) editProfileModal.classList.remove('hidden');
  }

  function closeEditModal() {
    if (editProfileModal) editProfileModal.classList.add('hidden');
  }

  if (btnOpenEditProfile) btnOpenEditProfile.addEventListener('click', openEditModal);
  if (btnHeroEditProfile) btnHeroEditProfile.addEventListener('click', openEditModal);
  if (btnCardEditProfile) btnCardEditProfile.addEventListener('click', openEditModal);
  if (dropEditProfileBtn) dropEditProfileBtn.addEventListener('click', openEditModal);
  if (btnCloseProfileModal) btnCloseProfileModal.addEventListener('click', closeEditModal);
  if (btnCancelProfileModal) btnCancelProfileModal.addEventListener('click', closeEditModal);
  if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
      if (e.target === editProfileModal) closeEditModal();
    });
  }

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = editName ? editName.value.trim() : '';
      const dob = editDob ? editDob.value : '';
      const mobile = editMobile ? editMobile.value.trim() : '';

      if (!name || name.length < 2) {
        showToast('Name must be at least 2 characters.', 'error');
        return;
      }

      if (!dob) {
        showToast('Please select your date of birth.', 'error');
        return;
      }

      if (!mobile || mobile.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid mobile number (10+ digits).', 'error');
        return;
      }

      currentUser.name = name;
      currentUser.dob = dob;
      currentUser.mobile = mobile;

      saveActiveUser(currentUser);
      renderProfile();
      closeEditModal();
      showToast('Profile updated successfully!', 'success');
    });
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

  if (headerThemeToggle) headerThemeToggle.addEventListener('click', toggleTheme);

  // ==========================================================================
  // USER DROPDOWN & LOGOUT
  // ==========================================================================

  if (headerUserBtn && userDropdownMenu) {
    headerUserBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('hidden');
      const isExpanded = !userDropdownMenu.classList.contains('hidden');
      headerUserBtn.setAttribute('aria-expanded', isExpanded);
    });

    document.addEventListener('click', (e) => {
      if (!userDropdownMenu.contains(e.target) && !headerUserBtn.contains(e.target)) {
        userDropdownMenu.classList.add('hidden');
        headerUserBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function handleLogout() {
    localStorage.removeItem('taskflow_active_user');
    sessionStorage.removeItem('taskflow_active_user');
    showToast('Signed out successfully. Redirecting to login...', 'info', 1800);
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }

  if (btnSidebarLogout) btnSidebarLogout.addEventListener('click', handleLogout);
  if (btnHeaderLogout) btnHeaderLogout.addEventListener('click', handleLogout);
  if (btnCardLogout) btnCardLogout.addEventListener('click', handleLogout);

  // Mobile sidebar
  if (sidebarOpenBtn && dashSidebar) {
    sidebarOpenBtn.addEventListener('click', () => dashSidebar.classList.add('mobile-open'));
  }
  if (sidebarCloseBtn && dashSidebar) {
    sidebarCloseBtn.addEventListener('click', () => dashSidebar.classList.remove('mobile-open'));
  }

  // ==========================================================================
  // 1. 🤖 AI TASK ASSISTANT CONTROLLER
  // ==========================================================================

  const aiChatWindow = document.getElementById('ai-chat-window');
  const aiChatForm = document.getElementById('ai-chat-form');
  const aiUserInput = document.getElementById('ai-user-input');
  const aiTypingIndicator = document.getElementById('ai-typing-indicator');
  const btnClearAiChat = document.getElementById('btn-clear-ai-chat');
  const aiPromptChips = document.querySelectorAll('.ai-chip');
  const aiUserName = document.getElementById('ai-user-name');

  // Update AI greeting with user's first name
  if (aiUserName && currentUser) {
    aiUserName.textContent = currentUser.name.split(' ')[0] || 'there';
  }

  // Smart AI Response Generator
  function generateAiResponse(prompt) {
    const p = prompt.toLowerCase();
    const userFirstName = currentUser.name ? currentUser.name.split(' ')[0] : 'friend';

    if (p.includes('plan') || p.includes('today') || p.includes('morning')) {
      return `
        <strong>⚡ Personalized Daily Task Plan for ${userFirstName}:</strong>
        <br><br>
        Here is your recommended 3-stage high-impact plan for today:
        <ul class="ai-list-preview">
          <li>🔴 <strong>Task 1 (Priority Urgent)</strong>: Deep Work Focus block — Complete your main deliverable (90 mins).</li>
          <li>🟠 <strong>Task 2 (Priority High)</strong>: Task organization & code/document review (45 mins).</li>
          <li>🔵 <strong>Task 3 (Priority Medium)</strong>: Clean backlog, reply to pending communications, and plan tomorrow's milestones (30 mins).</li>
        </ul>
        <br>
        💡 <em>Pro Tip: Tackle Task 1 early before checking notifications to maximize focus.</em>
      `;
    }

    if (p.includes('project') || p.includes('break down') || p.includes('steps')) {
      return `
        <strong>📋 5-Step Project Breakdown Plan:</strong>
        <br><br>
        Here is an actionable milestone roadmap for your project:
        <ul class="ai-list-preview">
          <li><strong>Phase 1: Architecture & Scope</strong> — Define requirements, data schema, and wireframes (Est. 2 hrs).</li>
          <li><strong>Phase 2: Authentication & Security</strong> — Setup user sessions, validation rules, and profile guards (Est. 3 hrs).</li>
          <li><strong>Phase 3: Core UI / Feature Implementation</strong> — Develop primary user interfaces and responsive layouts (Est. 4 hrs).</li>
          <li><strong>Phase 4: Integration & Edge Cases</strong> — Connect data handling, test error boundaries, and notifications (Est. 2 hrs).</li>
          <li><strong>Phase 5: Polish & Deployment</strong> — Verify responsive performance, review checklist, and deploy (Est. 1 hr).</li>
        </ul>
        <br>
        🎯 <em>Would you like me to create sub-tasks for any specific phase?</em>
      `;
    }

    if (p.includes('schedule') || p.includes('pomodoro') || p.includes('hour') || p.includes('focus')) {
      return `
        <strong>🕒 4-Hour Focused Deep Work Schedule:</strong>
        <br><br>
        Using the high-performance 50/10 Pomodoro rhythm:
        <ul class="ai-list-preview">
          <li>⚡ <strong>09:00 - 09:50</strong>: Sprint 1 — Hardest cognitive task. No interruptions (50 mins).</li>
          <li>☕ <strong>09:50 - 10:00</strong>: Break 1 — Hydrate, step away from screens (10 mins).</li>
          <li>⚡ <strong>10:00 - 10:50</strong>: Sprint 2 — Build, code, or write main deliverable (50 mins).</li>
          <li>🚶 <strong>10:50 - 11:00</strong>: Break 2 — Light walk and stretch (10 mins).</li>
          <li>⚡ <strong>11:00 - 11:50</strong>: Sprint 3 — Validation, error checks, and documentation (50 mins).</li>
          <li>✨ <strong>11:50 - 12:00</strong>: Daily wrap-up and celebrating progress!</li>
        </ul>
      `;
    }

    if (p.includes('prioritize') || p.includes('urgent') || p.includes('matrix') || p.includes('eisenhower')) {
      return `
        <strong>🎯 Eisenhower Task Prioritization Framework:</strong>
        <br><br>
        Categorize your tasks into these four strategic quadrants:
        <ul class="ai-list-preview">
          <li>🔴 <strong>Quadrant 1 (Urgent & Important)</strong>: Do immediately — Critical deadlines, security fixes, urgent deliveries.</li>
          <li>🔵 <strong>Quadrant 2 (Not Urgent but Important)</strong>: Schedule dedicated time — Strategic goals, skill learning, system design.</li>
          <li>🟠 <strong>Quadrant 3 (Urgent but Not Important)</strong>: Delegate or automate — Repetitive notifications, routine requests.</li>
          <li>⚪ <strong>Quadrant 4 (Neither)</strong>: Eliminate — Time sinks and unproductive distractions.</li>
        </ul>
      `;
    }

    if (p.includes('procrastination') || p.includes('tips') || p.includes('habit') || p.includes('motivation')) {
      return `
        <strong>💡 3 High-Impact Anti-Procrastination Tactics:</strong>
        <br><br>
        <ul class="ai-list-preview">
          <li><strong>1. The 2-Minute Rule</strong>: If a task takes less than 2 minutes, do it right now without placing it on a queue.</li>
          <li><strong>2. Friction Reduction</strong>: Set up your workspace the night before so starting requires zero setup friction.</li>
          <li><strong>3. The 5-Minute Micro-Commitment</strong>: Tell yourself: <em>"I will only work on this for 5 minutes."</em> Once in flow, staying focused becomes effortless!</li>
        </ul>
        <br>
        🚀 <em>Start small right now, ${userFirstName}! Action breeds clarity.</em>
      `;
    }

    // Default intelligent task-oriented response
    return `
      <strong>🤖 AI Task Recommendation:</strong>
      <br><br>
      Here is my analysis for: <em>"${escapeHtml(prompt)}"</em>
      <br><br>
      <ul class="ai-list-preview">
        <li><strong>Step 1</strong>: Identify the immediate next tangible action step (under 20 mins).</li>
        <li><strong>Step 2</strong>: Isolate potential roadblocks and set a clear definition of "Done".</li>
        <li><strong>Step 3</strong>: Allocate a distraction-free time slot today to execute without multitasking.</li>
      </ul>
      <br>
      ✨ <em>Let me know if you'd like me to break this down into specific sub-tasks or estimate time commitments!</em>
    `;
  }

  function appendChatMessage(sender, text, isUser = false) {
    if (!aiChatWindow) return;

    const msgEl = document.createElement('div');
    msgEl.className = `ai-msg ${isUser ? 'ai-msg-user' : 'ai-msg-bot'}`;

    const initials = currentUser && currentUser.name
      ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    msgEl.innerHTML = `
      <div class="ai-msg-avatar">${isUser ? initials : '🤖'}</div>
      <div class="ai-msg-content">
        <div class="ai-msg-sender">${isUser ? (currentUser.name ? currentUser.name.split(' ')[0] : 'You') : 'AI Task Assistant'}</div>
        <div class="ai-msg-text">${text}</div>
      </div>
    `;

    aiChatWindow.appendChild(msgEl);
    aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
  }

  // Handle Form Submit
  if (aiChatForm && aiUserInput) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const prompt = aiUserInput.value.trim();
      if (!prompt) return;

      // Append user prompt
      appendChatMessage('You', escapeHtml(prompt), true);
      aiUserInput.value = '';

      // Show typing indicator
      if (aiTypingIndicator) {
        aiTypingIndicator.classList.remove('hidden');
        aiChatWindow.scrollTop = aiChatWindow.scrollHeight;
      }

      // Simulate realistic AI generation
      setTimeout(() => {
        if (aiTypingIndicator) aiTypingIndicator.classList.add('hidden');
        const aiResponse = generateAiResponse(prompt);
        appendChatMessage('AI Task Assistant', aiResponse, false);
      }, 550);
    });
  }

  // Quick Prompt Chips
  aiPromptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt');
      if (!promptText || !aiUserInput) return;
      aiUserInput.value = promptText;
      aiChatForm.dispatchEvent(new Event('submit'));
    });
  });

  // Clear Chat Button
  if (btnClearAiChat) {
    btnClearAiChat.addEventListener('click', () => {
      if (!aiChatWindow) return;
      const firstName = currentUser && currentUser.name ? currentUser.name.split(' ')[0] : 'there';
      aiChatWindow.innerHTML = `
        <div class="ai-msg ai-msg-bot">
          <div class="ai-msg-avatar">🤖</div>
          <div class="ai-msg-content">
            <div class="ai-msg-sender">AI Task Assistant</div>
            <div class="ai-msg-text">
              Chat reset! Hello <strong>${firstName}</strong> 👋 How can I help you organize or plan your tasks right now?
            </div>
          </div>
        </div>
      `;
      showToast('AI Assistant chat cleared.', 'info', 1800);
    });
  }

  // ==========================================================================
  // SMART NOTIFICATIONS CONTROLLER
  // ==========================================================================

  const DEFAULT_NOTIFICATIONS = [
    {
      id: 'notif_1',
      type: 'assigned',
      title: 'New Task Assigned: Cloud Infrastructure Audit',
      message: 'Marcus Chen assigned you to perform the Q4 AWS Security & IAM Role Audit.',
      taskTitle: 'Cloud Infrastructure Audit',
      assignee: 'Alex Morgan',
      assignedBy: 'Marcus Chen',
      dueDate: 'Tomorrow, 5:00 PM',
      priority: 'High',
      timeAgo: '12m ago',
      timestamp: Date.now() - 12 * 60 * 1000,
      isRead: false,
      emailSent: true
    },
    {
      id: 'notif_2',
      type: 'reminder',
      title: 'Due-Date Reminder: Sprint Deliverable Submission',
      message: 'Proximity reminder: "Sprint Deliverable Submission" is due in 3 hours (Today at 6:00 PM).',
      taskTitle: 'Sprint Deliverable Submission',
      dueDate: 'Today, 6:00 PM',
      priority: 'Medium',
      timeAgo: '45m ago',
      timestamp: Date.now() - 45 * 60 * 1000,
      isRead: false,
      emailSent: true
    },
    {
      id: 'notif_3',
      type: 'overdue',
      title: 'CRITICAL OVERDUE ALERT: Database Backup & Verification',
      message: 'Action required! "Database Backup & Verification" was due yesterday and is currently overdue.',
      taskTitle: 'Database Backup & Verification',
      dueDate: 'Yesterday, 5:00 PM',
      priority: 'Urgent',
      timeAgo: '2h ago',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
      isRead: false,
      emailSent: true
    },
    {
      id: 'notif_4',
      type: 'mention',
      title: 'Sophia Patel mentioned you in API Specs',
      message: '"@Alex could you check if the OAuth2 refresh token rotation handles concurrent requests?"',
      taskTitle: 'API Specs & Token Handling',
      author: 'Sophia Patel',
      timeAgo: '3h ago',
      timestamp: Date.now() - 3 * 60 * 60 * 1000,
      isRead: false,
      emailSent: true
    }
  ];

  const DEFAULT_TASKS = [
    {
      id: 'task_1',
      title: 'Cloud Infrastructure & Container Deployment',
      desc: 'Configure Docker orchestration, automated CI/CD pipeline, and staging environment verification.',
      category: 'DevOps',
      assignee: 'Alex Morgan (You)',
      priority: 'Urgent',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
      mentions: '@Alex'
    },
    {
      id: 'task_2',
      title: 'Design System & Dark / Light Theme Refactor',
      desc: 'Refactor color tokens, CSS variables, and high-contrast typography for accessibility compliance.',
      category: 'Design',
      assignee: 'David Kim (Design)',
      priority: 'High',
      status: 'completed',
      dueDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
      mentions: ''
    },
    {
      id: 'task_3',
      title: 'OAuth2 Refresh Token Rotation & Session Guard',
      desc: 'Implement secure encrypted cookie storage, token refresh interceptors, and expired session redirects.',
      category: 'Development',
      assignee: 'Sophia Patel (Backend)',
      priority: 'High',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      mentions: '@Alex'
    },
    {
      id: 'task_4',
      title: 'Database Backup & Verification Routine',
      desc: 'Run automated daily snapshot verification, integrity hash checks, and disaster recovery drill.',
      category: 'DevOps',
      assignee: 'Alex Morgan (You)',
      priority: 'Urgent',
      status: 'pending',
      dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      mentions: ''
    },
    {
      id: 'task_5',
      title: 'Sprint Deliverable Submission & Client Demo',
      desc: 'Prepare the release notes, milestone presentation slides, and live staging sandbox demo.',
      category: 'Management',
      assignee: 'Alex Morgan (You)',
      priority: 'Medium',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0],
      mentions: ''
    },
    {
      id: 'task_6',
      title: 'End-to-End API Specs & Token Integration Testing',
      desc: 'Validate all REST endpoints against contract tests, payload boundaries, and response codes.',
      category: 'QA',
      assignee: 'Marcus Chen (Lead)',
      priority: 'Medium',
      status: 'completed',
      dueDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
      mentions: ''
    },
    {
      id: 'task_7',
      title: 'Mobile Viewport & Gesture Interaction Optimization',
      desc: 'Audit mobile navigation touch targets, modal transitions, and bottom sheet drawers.',
      category: 'Development',
      assignee: 'Alex Morgan (You)',
      priority: 'High',
      status: 'in-progress',
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
      mentions: ''
    },
    {
      id: 'task_8',
      title: 'Multi-Channel Smart Notification Hub & Email Templates',
      desc: 'Integrate task assignment alerts, due-date proximity alerts, audio chimes, and HTML email previews.',
      category: 'Development',
      assignee: 'Alex Morgan (You)',
      priority: 'Urgent',
      status: 'completed',
      dueDate: new Date().toISOString().split('T')[0],
      mentions: '@Alex'
    }
  ];

  // Primary Tasks Storage
  function getTasks() {
    try {
      const data = localStorage.getItem('taskflow_tasks');
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem('taskflow_tasks', JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
      // Keep monitored tasks in sync
      localStorage.setItem('taskflow_monitored_tasks', JSON.stringify(tasks));
    } catch {}
  }

  // Storage getters & setters
  function getNotifications() {
    try {
      const data = localStorage.getItem('taskflow_notifications');
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem('taskflow_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  }

  function saveNotifications(notifs) {
    try {
      localStorage.setItem('taskflow_notifications', JSON.stringify(notifs));
    } catch {}
  }

  function getMonitoredTasks() {
    return getTasks();
  }

  function saveMonitoredTasks(tasks) {
    saveTasks(tasks);
  }

  function getNotificationSettings() {
    try {
      const data = localStorage.getItem('taskflow_notif_settings');
      if (data) return JSON.parse(data);
    } catch {}
    const defaults = {
      inAppEnabled: true,
      assignedEnabled: true,
      reminderEnabled: true,
      overdueEnabled: true,
      mentionEnabled: true,
      emailFrequency: 'instant'
    };
    localStorage.setItem('taskflow_notif_settings', JSON.stringify(defaults));
    return defaults;
  }

  function saveNotificationSettings(settings) {
    try {
      localStorage.setItem('taskflow_notif_settings', JSON.stringify(settings));
    } catch {}
  }

  // Audio Chime synthesizer via Web Audio API
  function playNotificationChime() {
    const settings = getNotificationSettings();
    if (!settings.inAppEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // DOM Elements for Notifications
  const headerNotifBtn = document.getElementById('header-notif-btn');
  const notifDrawer = document.getElementById('notif-drawer');
  const headerNotifCount = document.getElementById('header-notif-count');
  const headerNotifPing = document.getElementById('header-notif-ping');
  const sidebarNotifBadge = document.getElementById('sidebar-notif-badge');
  const notifUnreadChip = document.getElementById('notif-unread-chip');
  const drawerNotifList = document.getElementById('drawer-notif-list');
  const notifFeedList = document.getElementById('notif-feed-list');
  const btnMarkAllRead = document.getElementById('btn-mark-all-read');
  const btnFeedMarkAll = document.getElementById('btn-feed-mark-all');
  const btnFeedClearAll = document.getElementById('btn-feed-clear-all');

  // Hero Stats DOM
  const statCountAssigned = document.getElementById('stat-count-assigned');
  const statCountReminders = document.getElementById('stat-count-reminders');
  const statCountOverdue = document.getElementById('stat-count-overdue');
  const statCountMentions = document.getElementById('stat-count-mentions');
  const statCountEmails = document.getElementById('stat-count-emails');
  const feedItemsCount = document.getElementById('feed-items-count');
  const prefUserEmail = document.getElementById('pref-user-email');

  // Simulator Buttons
  const simBtnAssigned = document.getElementById('sim-btn-assigned');
  const simBtnReminder = document.getElementById('sim-btn-reminder');
  const simBtnOverdue = document.getElementById('sim-btn-overdue');
  const simBtnMention = document.getElementById('sim-btn-mention');
  const simBtnEmail = document.getElementById('sim-btn-email');
  const btnQuickPreviewEmail = document.getElementById('btn-quick-preview-email');

  // Settings form elements
  const notifSettingsForm = document.getElementById('notif-settings-form');
  const prefInAppEnabled = document.getElementById('pref-in-app-enabled');
  const prefAssignedEnabled = document.getElementById('pref-assigned-enabled');
  const prefReminderEnabled = document.getElementById('pref-reminder-enabled');
  const prefOverdueEnabled = document.getElementById('pref-overdue-enabled');
  const prefMentionEnabled = document.getElementById('pref-mention-enabled');

  // Monitored tasks DOM
  const monitoredTasksList = document.getElementById('monitored-tasks-list');
  const btnOpenAddTaskModal = document.getElementById('btn-open-add-task-modal');
  const addTaskModal = document.getElementById('add-task-modal');
  const btnCloseTaskModal = document.getElementById('btn-close-task-modal');
  const btnCancelTaskModal = document.getElementById('btn-cancel-task-modal');
  const addTaskForm = document.getElementById('add-task-form');

  // Email modal DOM
  const emailPreviewModal = document.getElementById('email-preview-modal');
  const btnCloseEmailModal = document.getElementById('btn-close-email-modal');
  const btnDismissEmailModal = document.getElementById('btn-dismiss-email-modal');
  const btnResendEmailTest = document.getElementById('btn-resend-email-test');
  const modalEmailTitle = document.getElementById('modal-email-title');
  const modalEmailRecipientName = document.getElementById('modal-email-recipient-name');
  const modalEmailRecipientAddr = document.getElementById('modal-email-recipient-addr');
  const modalEmailDate = document.getElementById('modal-email-date');
  const emailBodyCanvas = document.getElementById('email-body-canvas');

  // Active filters
  let currentDrawerFilter = 'all';
  let currentHubFilter = 'all';
  let activePreviewNotif = null;

  // Render & Sync Badges and Counters
  function updateNotificationBadges() {
    const notifs = getNotifications();
    const unreadCount = notifs.filter(n => !n.isRead).length;

    if (headerNotifCount) {
      headerNotifCount.textContent = unreadCount;
      headerNotifCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    if (headerNotifPing) {
      headerNotifPing.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    if (sidebarNotifBadge) {
      sidebarNotifBadge.textContent = unreadCount;
      sidebarNotifBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
    if (notifUnreadChip) {
      notifUnreadChip.textContent = `${unreadCount} unread`;
    }
    if (feedItemsCount) {
      feedItemsCount.textContent = `${notifs.length} items`;
    }

    // Update Hero Stats
    if (statCountAssigned) statCountAssigned.textContent = notifs.filter(n => n.type === 'assigned').length;
    if (statCountReminders) statCountReminders.textContent = notifs.filter(n => n.type === 'reminder').length;
    if (statCountOverdue) statCountOverdue.textContent = notifs.filter(n => n.type === 'overdue').length;
    if (statCountMentions) statCountMentions.textContent = notifs.filter(n => n.type === 'mention').length;
    if (statCountEmails) statCountEmails.textContent = notifs.filter(n => n.emailSent).length;
    if (prefUserEmail && currentUser) prefUserEmail.textContent = currentUser.email || 'alex@taskflow.io';
  }

  // Generate HTML for a single notification card
  function createNotificationCardHtml(notif, isCompact = false) {
    const typeIcons = {
      assigned: '👤',
      reminder: '⏰',
      overdue: '🚨',
      mention: '💬'
    };

    const typeBadges = {
      assigned: '<span class="notif-type-pill pill-assigned">Assigned</span>',
      reminder: '<span class="notif-type-pill pill-reminder">Reminder</span>',
      overdue: '<span class="notif-type-pill pill-overdue">Overdue</span>',
      mention: '<span class="notif-type-pill pill-mention">Mention</span>'
    };

    const iconClass = {
      assigned: 'icon-assigned',
      reminder: 'icon-reminder',
      overdue: 'icon-overdue',
      mention: 'icon-mention'
    }[notif.type] || 'icon-assigned';

    const unreadClass = notif.isRead ? '' : 'unread';
    const typeClass = `type-${notif.type}`;

    return `
      <div class="notif-item-card ${unreadClass} ${typeClass}" data-id="${notif.id}">
        <div class="notif-type-icon ${iconClass}">
          ${typeIcons[notif.type] || '🔔'}
        </div>
        <div class="notif-content-wrap">
          <div class="notif-title-line">
            <h4 class="notif-card-title">${escapeHtml(notif.title)}</h4>
            ${typeBadges[notif.type] || ''}
          </div>
          <p class="notif-card-msg">${escapeHtml(notif.message)}</p>
          <div class="notif-meta-row">
            <span class="notif-time-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${escapeHtml(notif.timeAgo || 'Just now')}
            </span>
            ${notif.dueDate ? `<span style="color: var(--accent-amber); font-weight: 600;">📅 ${escapeHtml(notif.dueDate)}</span>` : ''}
            ${notif.priority ? `<span style="font-weight: 700; color: ${notif.priority === 'Urgent' ? 'var(--accent-rose)' : 'var(--primary)'};">⚡ ${escapeHtml(notif.priority)}</span>` : ''}
            <div class="notif-actions-inline">
              ${!notif.isRead ? `<button type="button" class="btn-notif-sub btn-action-read" data-id="${notif.id}">Mark read</button>` : ''}
              <button type="button" class="btn-notif-sub btn-action-preview-email" data-id="${notif.id}" title="Preview sent email">✉️ Email</button>
              <button type="button" class="btn-notif-delete btn-action-delete" data-id="${notif.id}" title="Remove notification">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Filter and render notifications into containers
  function renderAllNotifications() {
    const notifs = getNotifications();

    // 1. Render Drawer List
    if (drawerNotifList) {
      let filteredDrawer = [...notifs];
      if (currentDrawerFilter === 'unread') filteredDrawer = filteredDrawer.filter(n => !n.isRead);
      else if (currentDrawerFilter !== 'all') filteredDrawer = filteredDrawer.filter(n => n.type === currentDrawerFilter);

      if (filteredDrawer.length === 0) {
        drawerNotifList.innerHTML = `
          <div class="notif-empty-state">
            <div class="notif-empty-icon">🔕</div>
            <div class="notif-empty-title">All Caught Up!</div>
            <p class="notif-empty-desc">No notifications found in this category.</p>
          </div>
        `;
      } else {
        drawerNotifList.innerHTML = filteredDrawer.map(n => createNotificationCardHtml(n, true)).join('');
      }
    }

    // 2. Render Hub Feed List
    if (notifFeedList) {
      let filteredHub = [...notifs];
      if (currentHubFilter === 'unread') filteredHub = filteredHub.filter(n => !n.isRead);
      else if (currentHubFilter !== 'all') filteredHub = filteredHub.filter(n => n.type === currentHubFilter);

      if (filteredHub.length === 0) {
        notifFeedList.innerHTML = `
          <div class="notif-empty-state">
            <div class="notif-empty-icon">🔔</div>
            <div class="notif-empty-title">No Notifications</div>
            <p class="notif-empty-desc">Use the simulation studio buttons above to trigger live alerts.</p>
          </div>
        `;
      } else {
        notifFeedList.innerHTML = filteredHub.map(n => createNotificationCardHtml(n, false)).join('');
      }
    }

    updateNotificationBadges();
  }

  // ==========================================================================
  // TASK MANAGEMENT BOARD RENDERERS & LOGIC
  // ==========================================================================

  let currentTaskTab = 'all';
  let currentSearchQuery = '';
  let currentPriorityFilter = 'all';
  let currentCategoryFilter = 'all';
  let currentTaskView = 'kanban';

  function createKanbanCardHtml(task) {
    const todayStr = new Date().toISOString().split('T')[0];
    let dateClass = 'is-future';
    let datePrefix = '📅';
    let isOverdue = false;

    if (task.status !== 'completed') {
      if (task.dueDate < todayStr) {
        dateClass = 'is-overdue';
        datePrefix = '🚨';
        isOverdue = true;
      } else if (task.dueDate === todayStr) {
        dateClass = 'is-today';
        datePrefix = '⏰';
      }
    }

    const initials = task.assignee
      ? task.assignee.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'US';

    const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;

    // Next move button based on status
    let moveButtons = '';
    if (task.status === 'pending') {
      moveButtons = `<button type="button" class="btn-card-move btn-move-status" data-id="${task.id}" data-target-status="in-progress" title="Move to In Progress">→ In Progress</button>`;
    } else if (task.status === 'in-progress') {
      moveButtons = `
        <button type="button" class="btn-card-move btn-move-status" data-id="${task.id}" data-target-status="pending" title="Move to To Do">← To Do</button>
        <button type="button" class="btn-card-move btn-move-status" data-id="${task.id}" data-target-status="completed" style="background: var(--accent-emerald); color: #fff; border-color: var(--accent-emerald);" title="Mark Completed">✔ Done</button>
      `;
    } else if (task.status === 'completed') {
      moveButtons = `<button type="button" class="btn-card-move btn-move-status" data-id="${task.id}" data-target-status="in-progress" title="Reopen Task">↺ Reopen</button>`;
    }

    return `
      <div class="kanban-card ${isOverdue ? 'card-overdue' : ''}" data-id="${task.id}">
        <div class="kanban-card-top">
          <span class="task-card-category">${escapeHtml(task.category || 'General')}</span>
          <span class="priority-pill ${priorityClass}">● ${escapeHtml(task.priority || 'Medium')}</span>
        </div>

        <h4 class="kanban-card-title">${escapeHtml(task.title)}</h4>
        ${task.desc ? `<p class="kanban-card-desc">${escapeHtml(task.desc)}</p>` : ''}

        <div class="kanban-card-bottom">
          <span class="date-badge ${dateClass}">
            ${datePrefix} ${escapeHtml(task.dueDate || 'No date')}
          </span>
          <div class="assignee-chip" title="Assigned to ${escapeHtml(task.assignee)}">
            <span class="assignee-avatar-sm">${initials}</span>
            <span>${escapeHtml(task.assignee ? task.assignee.split(' ')[0] : 'User')}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; padding-top: 0.5rem; border-top: 1px solid var(--border-subtle);">
          <div class="kanban-actions">
            ${moveButtons}
          </div>
          <div style="display: flex; align-items: center; gap: 0.2rem;">
            <button type="button" class="btn-task-icon-action btn-edit-task" data-id="${task.id}" title="Edit Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="btn-task-icon-action action-delete btn-delete-task-action" data-id="${task.id}" title="Delete Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function createTableRowHtml(task) {
    const todayStr = new Date().toISOString().split('T')[0];
    let dateClass = 'is-future';
    let datePrefix = '📅';

    if (task.status !== 'completed') {
      if (task.dueDate < todayStr) {
        dateClass = 'is-overdue';
        datePrefix = '🚨';
      } else if (task.dueDate === todayStr) {
        dateClass = 'is-today';
        datePrefix = '⏰';
      }
    }

    const priorityClass = `priority-${(task.priority || 'medium').toLowerCase()}`;
    const statusLabel = {
      pending: 'To Do',
      'in-progress': 'In Progress',
      completed: 'Completed'
    }[task.status] || task.status;

    const statusBadgeClass = {
      pending: 'badge-pending',
      'in-progress': 'badge-in-progress',
      completed: 'badge-completed'
    }[task.status] || 'badge-pending';

    return `
      <tr data-id="${task.id}">
        <td>
          <div class="table-task-info">
            <span class="table-task-title">${escapeHtml(task.title)}</span>
            ${task.desc ? `<span class="table-task-desc">${escapeHtml(task.desc)}</span>` : ''}
          </div>
        </td>
        <td><span class="task-card-category">${escapeHtml(task.category || 'General')}</span></td>
        <td><span class="priority-pill ${priorityClass}">● ${escapeHtml(task.priority || 'Medium')}</span></td>
        <td>
          <div class="assignee-chip">
            <span class="assignee-avatar-sm">${task.assignee ? task.assignee.split(' ').map(n=>n[0]).join('').substring(0,2) : 'US'}</span>
            <span>${escapeHtml(task.assignee)}</span>
          </div>
        </td>
        <td><span class="date-badge ${dateClass}">${datePrefix} ${escapeHtml(task.dueDate)}</span></td>
        <td><span class="status-badge ${statusBadgeClass}">${statusLabel}</span></td>
        <td style="text-align: right;">
          <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
            <select class="btn-status-toggle table-status-select" data-id="${task.id}" style="background: var(--bg-input); border: 1px solid var(--border-subtle); padding: 0.25rem 0.5rem;" aria-label="Change Status">
              <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>To Do</option>
              <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
            <button type="button" class="btn-task-icon-action btn-edit-task" data-id="${task.id}" title="Edit Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button type="button" class="btn-task-icon-action action-delete btn-delete-task-action" data-id="${task.id}" title="Delete Task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderTasks() {
    const tasks = getTasks();
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute task counts
    const totalCount = tasks.length;
    const progressCount = tasks.filter(t => t.status === 'in-progress').length;
    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const overdueCount = tasks.filter(t => t.status !== 'completed' && t.dueDate < todayStr).length;

    // Update KPIs
    const kpiTotal = document.getElementById('kpi-total-tasks');
    const kpiProgress = document.getElementById('kpi-in-progress');
    const kpiPending = document.getElementById('kpi-pending');
    const kpiCompleted = document.getElementById('kpi-completed');

    if (kpiTotal) kpiTotal.textContent = totalCount;
    if (kpiProgress) kpiProgress.textContent = progressCount;
    if (kpiPending) kpiPending.textContent = pendingCount;
    if (kpiCompleted) kpiCompleted.textContent = completedCount;

    // Update KPI fills
    const kpiFillProgress = document.getElementById('kpi-fill-progress');
    const kpiFillPending = document.getElementById('kpi-fill-pending');
    const kpiFillCompleted = document.getElementById('kpi-fill-completed');

    if (kpiFillProgress) kpiFillProgress.style.width = totalCount > 0 ? `${Math.round((progressCount / totalCount) * 100)}%` : '0%';
    if (kpiFillPending) kpiFillPending.style.width = totalCount > 0 ? `${Math.round((pendingCount / totalCount) * 100)}%` : '0%';
    if (kpiFillCompleted) kpiFillCompleted.style.width = totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '0%';

    // Update Sprint progress in Hero
    const heroProgressText = document.getElementById('hero-progress-text');
    const heroProgressFill = document.getElementById('hero-progress-fill');
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    if (heroProgressText) heroProgressText.textContent = `${completedCount} of ${totalCount} completed (${completionPercent}%)`;
    if (heroProgressFill) heroProgressFill.style.width = `${completionPercent}%`;

    // Update Date Chip
    const heroChipDate = document.getElementById('hero-chip-date');
    if (heroChipDate) {
      heroChipDate.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Update Tab Counts
    const tabCountAll = document.getElementById('tab-count-all');
    const tabCountProgress = document.getElementById('tab-count-progress');
    const tabCountPending = document.getElementById('tab-count-pending');
    const tabCountCompleted = document.getElementById('tab-count-completed');
    const tabCountOverdue = document.getElementById('tab-count-overdue');

    if (tabCountAll) tabCountAll.textContent = totalCount;
    if (tabCountProgress) tabCountProgress.textContent = progressCount;
    if (tabCountPending) tabCountPending.textContent = pendingCount;
    if (tabCountCompleted) tabCountCompleted.textContent = completedCount;
    if (tabCountOverdue) tabCountOverdue.textContent = overdueCount;

    // Filter Tasks
    let filteredTasks = [...tasks];

    // Status Tab filter
    if (currentTaskTab === 'in-progress') {
      filteredTasks = filteredTasks.filter(t => t.status === 'in-progress');
    } else if (currentTaskTab === 'pending') {
      filteredTasks = filteredTasks.filter(t => t.status === 'pending');
    } else if (currentTaskTab === 'completed') {
      filteredTasks = filteredTasks.filter(t => t.status === 'completed');
    } else if (currentTaskTab === 'overdue') {
      filteredTasks = filteredTasks.filter(t => t.status !== 'completed' && t.dueDate < todayStr);
    }

    // Priority filter
    if (currentPriorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => (t.priority || '').toLowerCase() === currentPriorityFilter.toLowerCase());
    }

    // Category filter
    if (currentCategoryFilter !== 'all') {
      filteredTasks = filteredTasks.filter(t => (t.category || '').toLowerCase() === currentCategoryFilter.toLowerCase());
    }

    // Search query filter
    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.trim().toLowerCase();
      filteredTasks = filteredTasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.desc && t.desc.toLowerCase().includes(q)) ||
        (t.assignee && t.assignee.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    // Render Kanban columns
    const cardsTodo = document.getElementById('cards-todo');
    const cardsProgress = document.getElementById('cards-progress');
    const cardsCompleted = document.getElementById('cards-completed');

    const todoTasks = filteredTasks.filter(t => t.status === 'pending');
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress');
    const doneTasks = filteredTasks.filter(t => t.status === 'completed');

    const countTodo = document.getElementById('count-todo');
    const countProgress = document.getElementById('count-progress');
    const countCompleted = document.getElementById('count-completed');

    if (countTodo) countTodo.textContent = todoTasks.length;
    if (countProgress) countProgress.textContent = inProgressTasks.length;
    if (countCompleted) countCompleted.textContent = doneTasks.length;

    if (cardsTodo) {
      cardsTodo.innerHTML = todoTasks.length > 0
        ? todoTasks.map(createKanbanCardHtml).join('')
        : '<div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">No tasks in To Do</div>';
    }

    if (cardsProgress) {
      cardsProgress.innerHTML = inProgressTasks.length > 0
        ? inProgressTasks.map(createKanbanCardHtml).join('')
        : '<div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">No tasks in Progress</div>';
    }

    if (cardsCompleted) {
      cardsCompleted.innerHTML = doneTasks.length > 0
        ? doneTasks.map(createKanbanCardHtml).join('')
        : '<div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem;">No completed tasks</div>';
    }

    // Render Table View
    const tableBody = document.getElementById('tasks-table-body');
    if (tableBody) {
      tableBody.innerHTML = filteredTasks.length > 0
        ? filteredTasks.map(createTableRowHtml).join('')
        : '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No tasks match the active filters.</td></tr>';
    }

    // Render monitored tasks for notifications hub
    renderMonitoredTasks();
  }

  // Render Monitored Deadlines & Tasks Card for Notification Hub
  function renderMonitoredTasks() {
    if (!monitoredTasksList) return;
    const tasks = getTasks();
    const todayStr = new Date().toISOString().split('T')[0];

    if (tasks.length === 0) {
      monitoredTasksList.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
          No active tasks being monitored. Click "+ New Task" above to add one.
        </div>
      `;
      return;
    }

    monitoredTasksList.innerHTML = tasks.map(t => {
      let statusIndicator = 'ind-upcoming';
      let statusLabel = 'In Progress';
      let statusColor = 'var(--accent-cyan)';

      if (t.status === 'completed') {
        statusIndicator = 'ind-completed';
        statusLabel = 'DONE';
        statusColor = 'var(--accent-emerald)';
      } else if (t.dueDate < todayStr) {
        statusIndicator = 'ind-overdue';
        statusLabel = 'OVERDUE';
        statusColor = 'var(--accent-rose)';
      } else if (t.dueDate === todayStr) {
        statusIndicator = 'ind-reminder';
        statusLabel = 'DUE TODAY';
        statusColor = 'var(--accent-amber)';
      }

      return `
        <div class="monitored-task-card" data-id="${t.id}">
          <div class="task-card-left">
            <span class="task-status-indicator ${statusIndicator}" title="Status: ${statusLabel}"></span>
            <div class="task-info-block">
              <span class="task-title-text">${escapeHtml(t.title)}</span>
              <div class="task-sub-meta">
                <span>👤 ${escapeHtml(t.assignee)}</span>
                <span>•</span>
                <span style="color: ${statusColor}; font-weight: 600;">📅 ${escapeHtml(t.dueDate)}</span>
                ${t.mentions ? `<span>•</span><span style="color: var(--accent-cyan); font-weight: 600;">${escapeHtml(t.mentions)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="task-card-right">
            <span class="notif-type-pill" style="border: 1px solid var(--border-subtle); color: ${statusColor}; background: transparent;">
              ${statusLabel}
            </span>
            <button type="button" class="btn-secondary btn-sm btn-delete-task" data-id="${t.id}" title="Remove task" style="padding: 0.25rem 0.5rem;">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Create and add a new smart notification
  function addSmartNotification(notifData) {
    const notifs = getNotifications();
    const newNotif = {
      id: 'notif_' + Date.now(),
      type: notifData.type || 'assigned',
      title: notifData.title || 'Smart Notification',
      message: notifData.message || '',
      taskTitle: notifData.taskTitle || '',
      assignee: notifData.assignee || currentUser.name,
      assignedBy: notifData.assignedBy || 'TaskFlow Automation',
      dueDate: notifData.dueDate || '',
      priority: notifData.priority || 'Medium',
      timeAgo: 'Just now',
      timestamp: Date.now(),
      isRead: false,
      emailSent: true,
      ...notifData
    };

    notifs.unshift(newNotif);
    saveNotifications(notifs);

    playNotificationChime();
    renderAllNotifications();

    const settings = getNotificationSettings();
    if (settings.inAppEnabled) {
      showToast(`${newNotif.title}`, notifData.type === 'overdue' ? 'error' : 'info', 3200);
    }
  }

  // Mark single notification as read
  function markNotificationAsRead(id) {
    const notifs = getNotifications();
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      notifs[index].isRead = true;
      saveNotifications(notifs);
      renderAllNotifications();
    }
  }

  // Mark all as read
  function markAllNotificationsAsRead() {
    const notifs = getNotifications();
    notifs.forEach(n => { n.isRead = true; });
    saveNotifications(notifs);
    renderAllNotifications();
    showToast('All notifications marked as read.', 'success', 1800);
  }

  // Delete notification
  function deleteNotification(id) {
    let notifs = getNotifications();
    notifs = notifs.filter(n => n.id !== id);
    saveNotifications(notifs);
    renderAllNotifications();
  }

  // Clear all notifications
  function clearAllNotifications() {
    saveNotifications([]);
    renderAllNotifications();
    showToast('All notifications cleared.', 'info', 1800);
  }

  // Open Email Preview Modal
  function openEmailPreview(notif) {
    if (!notif) {
      const notifs = getNotifications();
      notif = notifs[0] || DEFAULT_NOTIFICATIONS[0];
    }
    activePreviewNotif = notif;

    const emailSubject = {
      assigned: `👤 New Task Assignment: "${notif.taskTitle || notif.title}"`,
      reminder: `⏰ Proximity Reminder: "${notif.taskTitle || notif.title}" due soon`,
      overdue: `🚨 URGENT OVERDUE ALERT: "${notif.taskTitle || notif.title}" action needed`,
      mention: `💬 ${notif.author || 'A colleague'} mentioned you in TaskFlow`
    }[notif.type] || `Notification: ${notif.title}`;

    if (modalEmailTitle) modalEmailTitle.textContent = `Subject: ${emailSubject}`;
    if (modalEmailRecipientName) modalEmailRecipientName.textContent = currentUser.name || 'Alex Morgan';
    if (modalEmailRecipientAddr) modalEmailRecipientAddr.textContent = currentUser.email || 'alex@taskflow.io';
    if (modalEmailDate) modalEmailDate.textContent = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

    const bannerClass = {
      assigned: 'email-banner-assigned',
      reminder: 'email-banner-reminder',
      overdue: 'email-banner-overdue',
      mention: 'email-banner-mention'
    }[notif.type] || 'email-banner-assigned';

    const bannerText = {
      assigned: 'Task Assigned',
      reminder: 'Due-Date Reminder',
      overdue: 'Critical Overdue Warning',
      mention: 'Team @Mention'
    }[notif.type] || 'Notification';

    if (emailBodyCanvas) {
      emailBodyCanvas.innerHTML = `
        <div class="email-canvas-header">
          <div class="email-canvas-brand">
            <div class="email-brand-logo-sq">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span class="email-brand-title">TaskFlow</span>
          </div>
          <span class="email-banner-badge ${bannerClass}">${bannerText}</span>
        </div>

        <h3 class="email-greeting-h3">Hello ${escapeHtml(currentUser.name.split(' ')[0] || 'there')},</h3>
        <p class="email-body-text">
          ${escapeHtml(notif.message)}
        </p>

        <div class="email-task-box">
          <div class="email-task-title-lg">📌 ${escapeHtml(notif.taskTitle || notif.title)}</div>
          <table class="email-task-table">
            <tr>
              <td><strong>Status:</strong></td>
              <td class="strong-val" style="color: ${notif.type === 'overdue' ? '#e11d48' : notif.type === 'reminder' ? '#b45309' : '#4338ca'};">
                ${bannerText}
              </td>
            </tr>
            ${notif.dueDate ? `<tr><td><strong>Due Date:</strong></td><td class="strong-val">${escapeHtml(notif.dueDate)}</td></tr>` : ''}
            ${notif.priority ? `<tr><td><strong>Priority:</strong></td><td class="strong-val">${escapeHtml(notif.priority)}</td></tr>` : ''}
            ${notif.assignedBy ? `<tr><td><strong>Assigned By:</strong></td><td class="strong-val">${escapeHtml(notif.assignedBy)}</td></tr>` : ''}
            ${notif.author ? `<tr><td><strong>Mentioned By:</strong></td><td class="strong-val">${escapeHtml(notif.author)}</td></tr>` : ''}
          </table>
        </div>

        <div class="email-cta-row">
          <a href="#smart-notifications" class="email-primary-btn" onclick="document.getElementById('email-preview-modal').classList.add('hidden');">
            Open in TaskFlow Dashboard →
          </a>
        </div>

        <div class="email-canvas-footer">
          You are receiving this message because automated notifications are enabled for <strong>${escapeHtml(currentUser.email || 'alex@taskflow.io')}</strong>.<br>
          To configure your notification channels or digest schedule, visit your TaskFlow Notification Center.
        </div>
      `;
    }

    if (emailPreviewModal) emailPreviewModal.classList.remove('hidden');
  }

  function closeEmailPreview() {
    if (emailPreviewModal) emailPreviewModal.classList.add('hidden');
  }

  // Interactive Simulation Studio Triggers
  if (simBtnAssigned) {
    simBtnAssigned.addEventListener('click', () => {
      addSmartNotification({
        type: 'assigned',
        title: 'New Task Assigned: Mobile Responsive QA & Audit',
        message: 'Marcus Chen assigned you to: "Mobile Responsive QA & Audit" for release v2.4.',
        taskTitle: 'Mobile Responsive QA & Audit',
        assignee: currentUser.name,
        assignedBy: 'Marcus Chen (Lead)',
        dueDate: 'Oct 5, 2026, 4:00 PM',
        priority: 'High'
      });
    });
  }

  if (simBtnReminder) {
    simBtnReminder.addEventListener('click', () => {
      addSmartNotification({
        type: 'reminder',
        title: 'Due-Date Reminder: Client Presentation Deck',
        message: 'Approaching deadline! "Client Presentation Deck" is due in 3 hours today.',
        taskTitle: 'Client Presentation Deck',
        dueDate: 'Today at 5:00 PM',
        priority: 'Urgent'
      });
    });
  }

  if (simBtnOverdue) {
    simBtnOverdue.addEventListener('click', () => {
      addSmartNotification({
        type: 'overdue',
        title: '🚨 CRITICAL OVERDUE: SSL Certificate & Domain Renewal',
        message: 'Urgent alert! "SSL Certificate & Domain Renewal" was due yesterday and is now overdue.',
        taskTitle: 'SSL Certificate & Domain Renewal',
        dueDate: 'Oct 2, 2026 (Yesterday)',
        priority: 'Urgent'
      });
    });
  }

  if (simBtnMention) {
    simBtnMention.addEventListener('click', () => {
      addSmartNotification({
        type: 'mention',
        title: 'David Kim mentioned you in Design Review',
        message: '"@Alex could you check the light-mode contrast ratio on the new smart notification drawer?"',
        taskTitle: 'Design Review & Theme Contrast',
        author: 'David Kim (Design)'
      });
    });
  }

  if (simBtnEmail) {
    simBtnEmail.addEventListener('click', () => {
      const notifs = getNotifications();
      openEmailPreview(notifs[0]);
    });
  }

  if (btnQuickPreviewEmail) {
    btnQuickPreviewEmail.addEventListener('click', () => {
      const notifs = getNotifications();
      openEmailPreview(notifs[0]);
    });
  }

  if (btnResendEmailTest) {
    btnResendEmailTest.addEventListener('click', () => {
      playNotificationChime();
      showToast(`Email dispatched to ${currentUser.email || 'alex@taskflow.io'} successfully!`, 'success', 2200);
    });
  }

  // Header Bell Dropdown Toggle
  if (headerNotifBtn && notifDrawer) {
    headerNotifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDrawer.classList.toggle('hidden');
      headerNotifBtn.setAttribute('aria-expanded', !notifDrawer.classList.contains('hidden'));
      if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!notifDrawer.contains(e.target) && !headerNotifBtn.contains(e.target)) {
        notifDrawer.classList.add('hidden');
        headerNotifBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Drawer Category Filter Pills
  document.querySelectorAll('.notif-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.notif-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDrawerFilter = btn.getAttribute('data-filter') || 'all';
      renderAllNotifications();
    });
  });

  // Hub Feed Filter Tabs
  document.querySelectorAll('[data-hub-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-hub-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentHubFilter = btn.getAttribute('data-hub-filter') || 'all';
      renderAllNotifications();
    });
  });

  // Delegated Event Handlers for Notifications (Read, Email, Delete)
  document.addEventListener('click', (e) => {
    const btnRead = e.target.closest('.btn-action-read');
    if (btnRead) {
      e.stopPropagation();
      markNotificationAsRead(btnRead.getAttribute('data-id'));
      return;
    }

    const btnPreview = e.target.closest('.btn-action-preview-email');
    if (btnPreview) {
      e.stopPropagation();
      const notifs = getNotifications();
      const notif = notifs.find(n => n.id === btnPreview.getAttribute('data-id'));
      openEmailPreview(notif);
      return;
    }

    const btnDelete = e.target.closest('.btn-action-delete');
    if (btnDelete) {
      e.stopPropagation();
      deleteNotification(btnDelete.getAttribute('data-id'));
      return;
    }

    const btnDeleteTask = e.target.closest('.btn-delete-task');
    if (btnDeleteTask) {
      e.stopPropagation();
      let tasks = getMonitoredTasks();
      tasks = tasks.filter(t => t.id !== btnDeleteTask.getAttribute('data-id'));
      saveMonitoredTasks(tasks);
      renderMonitoredTasks();
      showToast('Monitored task removed.', 'info', 1600);
      return;
    }
  });

  if (btnMarkAllRead) btnMarkAllRead.addEventListener('click', markAllNotificationsAsRead);
  if (btnFeedMarkAll) btnFeedMarkAll.addEventListener('click', markAllNotificationsAsRead);
  if (btnFeedClearAll) btnFeedClearAll.addEventListener('click', clearAllNotifications);

  // Email Modal Close
  if (btnCloseEmailModal) btnCloseEmailModal.addEventListener('click', closeEmailPreview);
  if (btnDismissEmailModal) btnDismissEmailModal.addEventListener('click', closeEmailPreview);
  if (emailPreviewModal) {
    emailPreviewModal.addEventListener('click', (e) => {
      if (e.target === emailPreviewModal) closeEmailPreview();
    });
  }

  // Settings Form Handler
  function loadNotificationSettingsToForm() {
    const s = getNotificationSettings();
    if (prefInAppEnabled) prefInAppEnabled.checked = s.inAppEnabled !== false;
    if (prefAssignedEnabled) prefAssignedEnabled.checked = s.assignedEnabled !== false;
    if (prefReminderEnabled) prefReminderEnabled.checked = s.reminderEnabled !== false;
    if (prefOverdueEnabled) prefOverdueEnabled.checked = s.overdueEnabled !== false;
    if (prefMentionEnabled) prefMentionEnabled.checked = s.mentionEnabled !== false;
    const freqInput = document.querySelector(`input[name="email_freq"][value="${s.emailFrequency || 'instant'}"]`);
    if (freqInput) freqInput.checked = true;
  }

  if (notifSettingsForm) {
    notifSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const freq = document.querySelector('input[name="email_freq"]:checked') ? document.querySelector('input[name="email_freq"]:checked').value : 'instant';
      const settings = {
        inAppEnabled: prefInAppEnabled ? prefInAppEnabled.checked : true,
        assignedEnabled: prefAssignedEnabled ? prefAssignedEnabled.checked : true,
        reminderEnabled: prefReminderEnabled ? prefReminderEnabled.checked : true,
        overdueEnabled: prefOverdueEnabled ? prefOverdueEnabled.checked : true,
        mentionEnabled: prefMentionEnabled ? prefMentionEnabled.checked : true,
        emailFrequency: freq
      };
      saveNotificationSettings(settings);
      showToast('Notification preferences saved successfully!', 'success', 2200);
    });
  }

  // ==========================================================================
  // TASK MANAGEMENT BOARD & MODAL CONTROLS
  // ==========================================================================

  const btnHeaderCreate = document.getElementById('header-create-task-btn');
  const btnHeroCreate = document.getElementById('btn-hero-create-task');
  const btnBoardCreate = document.getElementById('btn-board-create-task');
  const taskSearchInput = document.getElementById('task-search-input');
  const taskPriorityFilter = document.getElementById('task-priority-filter');
  const taskCategoryFilter = document.getElementById('task-category-filter');
  const btnViewKanban = document.getElementById('btn-view-kanban');
  const btnViewTable = document.getElementById('btn-view-table');
  const kanbanBoardContainer = document.getElementById('kanban-board-container');
  const tableViewContainer = document.getElementById('table-view-container');

  function openAddTaskModal(defaultStatus = 'pending', taskToEdit = null) {
    if (!addTaskModal) return;

    const modalTitle = document.getElementById('modal-add-task-title');
    const taskIdHidden = document.getElementById('task-id-hidden');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const categoryInput = document.getElementById('task-category-input');
    const priorityInput = document.getElementById('task-priority-input');
    const assigneeInput = document.getElementById('task-assignee-input');
    const statusInput = document.getElementById('task-status-input');
    const dueDateInput = document.getElementById('task-due-date-input');
    const mentionInput = document.getElementById('task-mention-input');
    const submitBtn = document.getElementById('btn-submit-task');

    if (taskToEdit) {
      if (modalTitle) modalTitle.textContent = `Edit Task: ${taskToEdit.title}`;
      if (taskIdHidden) taskIdHidden.value = taskToEdit.id;
      if (titleInput) titleInput.value = taskToEdit.title || '';
      if (descInput) descInput.value = taskToEdit.desc || '';
      if (categoryInput) categoryInput.value = taskToEdit.category || 'Development';
      if (priorityInput) priorityInput.value = taskToEdit.priority || 'Medium';
      if (assigneeInput) assigneeInput.value = taskToEdit.assignee || currentUser.name;
      if (statusInput) statusInput.value = taskToEdit.status || 'pending';
      if (dueDateInput) dueDateInput.value = taskToEdit.dueDate || '';
      if (mentionInput) mentionInput.value = taskToEdit.mentions || '';
      if (submitBtn) submitBtn.textContent = 'Update Task';
    } else {
      if (modalTitle) modalTitle.textContent = 'Create New Task';
      if (taskIdHidden) taskIdHidden.value = '';
      if (addTaskForm) addTaskForm.reset();
      if (statusInput) statusInput.value = defaultStatus;
      if (categoryInput) categoryInput.value = 'Development';
      if (priorityInput) priorityInput.value = 'Medium';
      if (assigneeInput) assigneeInput.value = currentUser.name || 'Alex Morgan (You)';
      if (dueDateInput) {
        const today = new Date().toISOString().split('T')[0];
        dueDateInput.value = today;
      }
      if (submitBtn) submitBtn.textContent = 'Save & Monitor Task';
    }

    addTaskModal.classList.remove('hidden');
    if (titleInput) setTimeout(() => titleInput.focus(), 80);
  }

  function closeAddTaskModal() {
    if (addTaskModal) addTaskModal.classList.add('hidden');
  }

  // Open modal buttons
  if (btnHeaderCreate) btnHeaderCreate.addEventListener('click', () => openAddTaskModal('pending'));
  if (btnHeroCreate) btnHeroCreate.addEventListener('click', () => openAddTaskModal('pending'));
  if (btnBoardCreate) btnBoardCreate.addEventListener('click', () => openAddTaskModal('pending'));
  if (btnOpenAddTaskModal) btnOpenAddTaskModal.addEventListener('click', () => openAddTaskModal('pending'));

  // Kanban column "+ Add Task" buttons
  document.querySelectorAll('.btn-col-add-task').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStatus = btn.getAttribute('data-status') || 'pending';
      openAddTaskModal(targetStatus);
    });
  });

  if (btnCloseTaskModal) btnCloseTaskModal.addEventListener('click', closeAddTaskModal);
  if (btnCancelTaskModal) btnCancelTaskModal.addEventListener('click', closeAddTaskModal);
  if (addTaskModal) {
    addTaskModal.addEventListener('click', (e) => {
      if (e.target === addTaskModal) closeAddTaskModal();
    });
  }

  // Add / Edit Task Form Submission
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskIdHidden = document.getElementById('task-id-hidden');
      const titleInput = document.getElementById('task-title-input');
      const descInput = document.getElementById('task-desc-input');
      const categoryInput = document.getElementById('task-category-input');
      const priorityInput = document.getElementById('task-priority-input');
      const assigneeInput = document.getElementById('task-assignee-input');
      const statusInput = document.getElementById('task-status-input');
      const dueDateInput = document.getElementById('task-due-date-input');
      const mentionInput = document.getElementById('task-mention-input');

      const taskId = taskIdHidden ? taskIdHidden.value.trim() : '';
      const title = titleInput ? titleInput.value.trim() : '';
      const desc = descInput ? descInput.value.trim() : '';
      const category = categoryInput ? categoryInput.value : 'Development';
      const priority = priorityInput ? priorityInput.value : 'Medium';
      const assignee = assigneeInput ? assigneeInput.value : (currentUser.name || 'Alex Morgan');
      const status = statusInput ? statusInput.value : 'pending';
      const dueDate = dueDateInput ? dueDateInput.value : '';
      const mentions = mentionInput ? mentionInput.value.trim() : '';

      if (!title || !dueDate) {
        showToast('Please enter both a task title and a valid due date.', 'error');
        return;
      }

      const tasks = getTasks();
      const todayStr = new Date().toISOString().split('T')[0];

      if (taskId) {
        // Edit existing task
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx !== -1) {
          tasks[idx] = {
            ...tasks[idx],
            title,
            desc,
            category,
            priority,
            assignee,
            status,
            dueDate,
            mentions
          };
          saveTasks(tasks);
          renderTasks();
          showToast(`Task "${title}" updated successfully!`, 'success', 2200);
        }
      } else {
        // Create new task
        const newTask = {
          id: 'task_' + Date.now(),
          title,
          desc,
          category,
          priority,
          assignee,
          status,
          dueDate,
          mentions
        };

        tasks.unshift(newTask);
        saveTasks(tasks);
        renderTasks();

        // Trigger automatic smart notifications based on due date proximity
        if (status !== 'completed') {
          if (dueDate < todayStr) {
            addSmartNotification({
              type: 'overdue',
              title: `CRITICAL OVERDUE ALERT: ${title}`,
              message: `Urgent action required! "${title}" is past its deadline (${dueDate}) and is overdue.`,
              taskTitle: title,
              dueDate,
              priority
            });
          } else if (dueDate === todayStr) {
            addSmartNotification({
              type: 'reminder',
              title: `Due-Date Reminder: ${title}`,
              message: `Approaching deadline! "${title}" is due today (${dueDate}).`,
              taskTitle: title,
              dueDate,
              priority
            });
          } else {
            addSmartNotification({
              type: 'assigned',
              title: `Task Assigned: ${title}`,
              message: `New task assigned to ${assignee} with deadline on ${dueDate}.`,
              taskTitle: title,
              assignee,
              dueDate,
              priority
            });
          }
        }

        // Trigger mention notification if collaborator @tagged
        if (mentions && mentions.includes('@')) {
          setTimeout(() => {
            addSmartNotification({
              type: 'mention',
              title: `Mention in "${title}"`,
              message: `Collaborator note: "${mentions}"`,
              taskTitle: title,
              author: currentUser.name || 'Alex Morgan'
            });
          }, 600);
        }

        showToast('New task created & real-time deadline monitoring active!', 'success', 2500);
      }

      closeAddTaskModal();
      addTaskForm.reset();
    });
  }

  // Move task status
  function moveTaskStatus(id, targetStatus) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.status = targetStatus;
    saveTasks(tasks);
    renderTasks();

    if (targetStatus === 'completed') {
      showToast(`🎉 "${task.title}" marked as completed!`, 'success', 2200);
    } else {
      const label = targetStatus === 'in-progress' ? 'In Progress' : 'To Do';
      showToast(`Moved "${task.title}" to ${label}.`, 'info', 1800);
    }
  }

  // Global Delegated Click Handlers for Task Actions
  document.addEventListener('click', (e) => {
    // 1. Move task status button in Kanban cards
    const btnMove = e.target.closest('.btn-move-status');
    if (btnMove) {
      e.stopPropagation();
      const id = btnMove.getAttribute('data-id');
      const targetStatus = btnMove.getAttribute('data-target-status');
      if (id && targetStatus) moveTaskStatus(id, targetStatus);
      return;
    }

    // 2. Edit task action
    const btnEdit = e.target.closest('.btn-edit-task');
    if (btnEdit) {
      e.stopPropagation();
      const id = btnEdit.getAttribute('data-id');
      const tasks = getTasks();
      const task = tasks.find(t => t.id === id);
      if (task) openAddTaskModal(task.status, task);
      return;
    }

    // 3. Delete task action (from board or table)
    const btnDeleteAction = e.target.closest('.btn-delete-task-action');
    if (btnDeleteAction) {
      e.stopPropagation();
      const id = btnDeleteAction.getAttribute('data-id');
      let tasks = getTasks();
      const taskToDelete = tasks.find(t => t.id === id);
      const title = taskToDelete ? taskToDelete.title : 'Task';
      tasks = tasks.filter(t => t.id !== id);
      saveTasks(tasks);
      renderTasks();
      showToast(`"${title}" deleted from workspace.`, 'info', 1800);
      return;
    }
  });

  // Table view status change listener
  document.addEventListener('change', (e) => {
    if (e.target && e.target.matches('.table-status-select')) {
      const id = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      if (id && newStatus) moveTaskStatus(id, newStatus);
    }
  });

  // Task Board Search Input
  if (taskSearchInput) {
    taskSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      renderTasks();
    });
  }

  // Priority Filter
  if (taskPriorityFilter) {
    taskPriorityFilter.addEventListener('change', (e) => {
      currentPriorityFilter = e.target.value;
      renderTasks();
    });
  }

  // Category Filter
  if (taskCategoryFilter) {
    taskCategoryFilter.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      renderTasks();
    });
  }

  // View Switcher (Kanban vs Table)
  if (btnViewKanban && btnViewTable) {
    btnViewKanban.addEventListener('click', () => {
      currentTaskView = 'kanban';
      btnViewKanban.classList.add('active');
      btnViewTable.classList.remove('active');
      if (kanbanBoardContainer) kanbanBoardContainer.classList.remove('hidden');
      if (tableViewContainer) tableViewContainer.classList.add('hidden');
    });

    btnViewTable.addEventListener('click', () => {
      currentTaskView = 'table';
      btnViewTable.classList.add('active');
      btnViewKanban.classList.remove('active');
      if (kanbanBoardContainer) kanbanBoardContainer.classList.add('hidden');
      if (tableViewContainer) tableViewContainer.classList.remove('hidden');
    });
  }

  // Status Filter Tabs
  document.querySelectorAll('[data-task-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-task-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTaskTab = tab.getAttribute('data-task-tab') || 'all';
      renderTasks();
    });
  });

  // Top Nav Active Link Switching
  document.querySelectorAll('.top-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.top-nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Periodic Deadline Engine Scanner (Every 60s)
  function scanTaskDeadlines() {
    const tasks = getTasks();
    const todayStr = new Date().toISOString().split('T')[0];
    let changed = false;

    tasks.forEach(t => {
      if (t.status === 'completed') return;
      if (t.dueDate < todayStr && t.status !== 'overdue') {
        changed = true;
      }
    });

    if (changed) {
      renderTasks();
    }
  }

  setInterval(scanTaskDeadlines, 60000);

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  // Initialize
  applySavedTheme();
  renderProfile();
  loadNotificationSettingsToForm();
  renderAllNotifications();
  renderTasks();
  scanTaskDeadlines();
  showToast(`Welcome back, ${currentUser.name.split(' ')[0]}!`, 'success', 2500);
});

