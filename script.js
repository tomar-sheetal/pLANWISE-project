document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginPage = document.getElementById('login-page');
    const signupPage = document.getElementById('signup-page');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');

    // Planner Steps
    const plannerSteps = document.querySelectorAll('.planner-step');
    const nextToStep2 = document.getElementById('next-to-step-2');
    const backToStep1 = document.getElementById('back-to-step-1');
    const nextToStep3 = document.getElementById('next-to-step-3');
    const backToStep2 = document.getElementById('back-to-step-2');
    const generateExamPlanBtn = document.getElementById('generate-exam-plan');
    const subjectDetailsContainer = document.getElementById('subject-details-container');
    const subjectCountInput = document.getElementById('subject-count');
    const totalStudyHoursInput = document.getElementById('total-study-hours');

    const timetable = document.getElementById('timetable');
    const rescheduleBtn = document.getElementById('reschedule-btn');

    const mcqModal = document.getElementById('mcq-modal');
    const mcqSetupInputs = document.getElementById('mcq-setup-inputs');
    const mcqTestArea = document.getElementById('mcq-test-area');
    const startMcqBtn = document.getElementById('start-mcq-test');
    const mcqSubjectInput = document.getElementById('mcq-subject-input');
    const mcqTopicInput = document.getElementById('mcq-topic-input');
    const mcqLoadingText = document.getElementById('mcq-loading-text');
    const closeMcqModal = document.getElementById('close-mcq-modal');

    const mcqResultModal = document.getElementById('mcq-result-modal');
    const mcqOkBtn = document.getElementById('mcq-ok-btn');
    const nextMcqBtn = document.getElementById('next-mcq-btn');
    const mcqRetryBtn = document.getElementById('mcq-retry-btn');
    const mcqFinishBtn = document.getElementById('mcq-finish-btn');
    const mcqCloseBtn = document.getElementById('mcq-close-btn');

    const headerResetBtn = document.getElementById('header-reset-btn');
    const sidebarResetBtn = document.getElementById('sidebar-reset-btn');

    // --- State Variables ---
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let studyPlan = JSON.parse(localStorage.getItem('studyPlan')) || [];
    let streak = parseInt(localStorage.getItem('streak')) || 0;

    let currentTaskForMCQ = null;
    let mcqQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let subjectProgress = JSON.parse(localStorage.getItem('subjectProgress')) || {};

    // --- AI API Configuration (Google AI Studio - Gemini) ---
    // PASTE YOUR GOOGLE AI STUDIO API KEY HERE
    const API_KEY = "My_API_KEY"; 
    const GEMINI_MODEL = "gemini-flash-latest"; // Using the stable alias instead of a versioned name

    const motivationalQuotes = [
        "All power is within you. you can do anything and everything.",
        "Your only limit is you.",
        "You are the master of your own destiny.",
        "Slow progress is better than no progress. Stay positive and don,t give up.",
        "Don't stop until you're proud."
    ];

    // --- Authentication Logic ---
    function checkAuth() {
        if (currentUser) {
            authContainer.style.display = 'none';
            appContainer.style.display = 'flex';
            showPage('dashboard');
            updateDashboard();
            updateProgressTracker();
        } else {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
        }
    }

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginPage.classList.remove('active');
        signupPage.classList.add('active');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupPage.classList.remove('active');
        loginPage.classList.add('active');
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm-password').value;

        if (password !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        if (users.find(u => u.email === email)) {
            alert("Email already exists!");
            return;
        }

        users.push({ name, email, password });
        localStorage.setItem('users', JSON.stringify(users));
        alert("Account created! Please login.");
        showLogin.click();
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            checkAuth();
        } else {
            alert("Invalid credentials!");
        }
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        checkAuth();
    });

    // --- Navigation Logic ---
    function showPage(pageId) {
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

        menuItems.forEach(item => {
            if (item.dataset.page === pageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        if (window.innerWidth <= 992) {
            sidebar.classList.remove('open');
        }
    }

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(item.dataset.page);
        });
    });

    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // --- Multi-Step Planner Logic ---
    function goToStep(stepNumber) {
        plannerSteps.forEach(step => step.classList.remove('active'));
        document.getElementById(`step-${stepNumber}`).classList.add('active');
    }

    nextToStep2.addEventListener('click', () => {
        const count = parseInt(subjectCountInput.value);
        if (count < 1 || count > 10) {
            alert("Please enter between 1 and 10 subjects.");
            return;
        }

        subjectDetailsContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const card = document.createElement('div');
            card.className = 'subject-detail-card card';
            card.innerHTML = `
                <h3>Subject ${i}</h3>
                <div class="form-group">
                    <label>Subject Name</label>
                    <input type="text" class="subject-name" placeholder="e.g., Mathematics" required>
                </div>
                <div class="form-group">
                    <label>Exam Date</label>
                    <input type="date" class="exam-date" required>
                </div>
                <div class="form-group">
                    <label>Difficulty</label>
                    <select class="difficulty">
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
            `;
            subjectDetailsContainer.appendChild(card);
        }
        goToStep(2);
    });

    backToStep1.addEventListener('click', () => goToStep(1));

    nextToStep3.addEventListener('click', () => {
        const names = document.querySelectorAll('.subject-name');
        const dates = document.querySelectorAll('.exam-date');
        let valid = true;

        names.forEach(n => { if (!n.value) valid = false; });
        dates.forEach(d => { if (!d.value) valid = false; });

        if (!valid) {
            alert("Please fill in all subject names and exam dates.");
            return;
        }
        goToStep(3);
    });

    backToStep2.addEventListener('click', () => goToStep(2));

    generateExamPlanBtn.addEventListener('click', () => {
        const subjects = [];
        const subjectNameInputs = document.querySelectorAll('.subject-name');
        const examDateInputs = document.querySelectorAll('.exam-date');
        const difficultyInputs = document.querySelectorAll('.difficulty');
        const dailyHours = parseInt(totalStudyHoursInput.value);

        if (dailyHours < 1 || dailyHours > 16) {
            alert("Please enter study hours between 1 and 16.");
            return;
        }

        subjectNameInputs.forEach((input, i) => {
            subjects.push({
                name: input.value,
                examDate: new Date(examDateInputs[i].value),
                difficulty: difficultyInputs[i].value
            });
        });

        generateExamBasedPlan(subjects, dailyHours);
        alert("Study plan generated successfully!");
        displayPlan();
        showPage('planner'); // Stay on planner but show the table below
    });

    function generateExamBasedPlan(subjects, dailyHours) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate days remaining and priority
        subjects.forEach(s => {
            const examDate = new Date(s.examDate);
            examDate.setHours(0, 0, 0, 0);
            const diffTime = examDate - today;
            s.daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let diffWeight = s.difficulty === 'Hard' ? 1 : (s.difficulty === 'Medium' ? 2 : 3);
            s.priorityScore = s.daysLeft * 10 + diffWeight;
        });

        // Start from today and exclude subjects with past/today exams
        const validSubjects = subjects.filter(s => s.daysLeft > 0);

        if (validSubjects.length === 0) {
            alert("All exam dates are in the past or today!");
            return;
        }

        // Sort by priority score (earliest and hardest first)
        validSubjects.sort((a, b) => a.priorityScore - b.priorityScore);

        let newPlan = [];
        const maxDaysToPlan = 30; // Plan for next 30 days or until last exam
        const lastExamDate = new Date(Math.max(...validSubjects.map(s => s.examDate)));
        const daysToPlan = Math.min(maxDaysToPlan, Math.ceil((lastExamDate - today) / (1000 * 60 * 60 * 24)));

        for (let d = 0; d < daysToPlan; d++) {
            const currentPlanDate = new Date(today);
            currentPlanDate.setDate(today.getDate() + d);
            const dateStr = currentPlanDate.toISOString().split('T')[0];

            // Filter subjects whose exam is after this date
            // AND ensure this date is not ANY subject's exam date
            const isAnyExamToday = validSubjects.some(s => s.examDate.getTime() === currentPlanDate.getTime());
            if (isAnyExamToday) continue;

            const activeSubjects = validSubjects.filter(s => s.examDate > currentPlanDate);

            if (activeSubjects.length === 0) continue;

            // Distribute hours: Hard gets 50%, Medium 30%, Easy 20% of remaining if multiple
            // For simplicity: Take top 2 urgent subjects for the day
            const dailySubjects = activeSubjects.slice(0, 2);
            const hoursPerSubject = Math.floor(dailyHours / dailySubjects.length);

            dailySubjects.forEach(s => {
                newPlan.push({
                    id: Date.now() + Math.random(),
                    date: dateStr,
                    subject: s.name,
                    topic: `Comprehensive Study - ${s.difficulty} Focus`,
                    hours: hoursPerSubject,
                    difficulty: s.difficulty,
                    priority: s.daysLeft < 3 ? 'High' : (s.daysLeft < 7 ? 'Medium' : 'Low'),
                    completed: false
                });
            });
        }

        studyPlan = newPlan;
        localStorage.setItem('studyPlan', JSON.stringify(studyPlan));
        updateDashboard();
        updateProgressTracker();
    }

    // --- Table Display Logic ---
    function displayPlan() {
        timetable.innerHTML = '';
        if (studyPlan.length === 0) {
            timetable.innerHTML = '<p class="text-center">No tasks planned yet. Use the planner above to generate a schedule.</p>';
            rescheduleBtn.style.display = 'none';
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter out past dates for display
        const futureTasks = studyPlan.filter(task => {
            const taskDate = new Date(task.date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate >= today;
        });

        if (futureTasks.length === 0) {
            timetable.innerHTML = '<p class="text-center">No upcoming tasks. Please generate a new plan.</p>';
            rescheduleBtn.style.display = 'none';
            return;
        }

        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Hours</th>
                    <th>Priority</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody id="plan-tbody"></tbody>
        `;
        timetable.appendChild(table);
        const tbody = document.getElementById('plan-tbody');

        // Sort plan by date
        futureTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

        futureTasks.forEach(task => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${task.date}</td>
                <td style="display: flex; align-items: center; gap: 8px;">
                    <img src="book.jpg" style="width: 20px; height: 20px; object-fit: contain;" alt="">
                    <span>${task.subject}</span>
                </td>
                <td>${task.hours}h</td>
                <td><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                <td><input type="checkbox" class="task-checkbox" ${task.completed ? 'checked disabled' : ''} data-id="${task.id}"></td>
            `;
            tbody.appendChild(row);
        });

        rescheduleBtn.style.display = 'block';

        // Add checkbox listeners
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const taskId = parseFloat(e.target.dataset.id);
                    const task = studyPlan.find(t => t.id === taskId);
                    openMCQModal(task);
                    e.target.checked = false; // Reset until MCQ passed
                }
            });
        });
    }

    rescheduleBtn.addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        studyPlan.forEach(task => {
            if (!task.completed && task.date < today) {
                task.date = today;
            }
        });
        saveAndRefresh();
        alert("Unfinished past tasks moved to today!");
    });

    // --- AI MCQ Logic ---
    function openMCQModal(task) {
        currentTaskForMCQ = task;
        mcqModal.classList.add('active');
        mcqSetupInputs.style.display = 'block';
        mcqTestArea.style.display = 'none';
        mcqSubjectInput.value = task.subject;
        mcqTopicInput.value = '';
    }

    async function generateMCQ(subject, topic) {
        const loadingText = document.getElementById('mcq-loading-text');
        try {
            console.log(`AI Assessment: Generating for ${subject} - ${topic}...`);
            
            if (!API_KEY || API_KEY.trim() === "" || API_KEY.includes("YOUR_")) {
                throw new Error('API Key is missing! Please paste it in script.js line 63.');
            }

            // Use v1beta for better JSON mode support and Flash features
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
            
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate exactly 10 difficult multiple-choice questions for the topic "${topic}" in the subject "${subject}".
                            
                            Return the response as a JSON array of objects. Each object must have:
                            - "question": string
                            - "options": array of 4 strings
                            - "correct": integer (0, 1, 2, or 3)
                            
                            STRICT: Return ONLY the JSON array. No markdown, no triple backticks.`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2048,
                        response_mime_type: "application/json"
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errMsg = errData.error?.message || `Status ${response.status}`;
                
                // Fallback attempt: try gemini-1.5-pro via v1beta
                console.warn(`Primary model failed: ${errMsg}. Trying fallback...`);
                const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;
                const fallbackRes = await fetch(fallbackUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Generate exactly 10 MCQ for ${subject} topic ${topic} as a JSON array.` }] }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 2048,
                            response_mime_type: "application/json"
                        }
                    })
                });

                if (!fallbackRes.ok) {
                    throw new Error(errMsg); // If fallback also fails, throw original error
                }
                
                const fallbackData = await fallbackRes.json();
                return processAIResponse(fallbackData.candidates[0].content.parts[0].text);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error('Invalid response structure from AI.');
            }

            return processAIResponse(data.candidates[0].content.parts[0].text);

        } catch (error) {
            console.error('Real-time generation failed:', error.message);
            if (loadingText) {
                loadingText.innerHTML = `<span style="color: #ff6b6b; font-size: 14px;">⚠️ ${error.message.includes('Key') ? 'Check API Key' : 'AI Error: ' + error.message.substring(0, 30)}... Offline mode active.</span>`;
            }
            return generateFallbackQuestions(subject, topic);
        }
    }

    function processAIResponse(text) {
        let content = text.trim();
        try {
            // Try parsing directly first
            return JSON.parse(content);
        } catch (e) {
            // Fallback: search for JSON array within the text
            const start = content.indexOf('[');
            const end = content.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                content = content.substring(start, end + 1);
            }
            
            const questions = JSON.parse(content);
            if (Array.isArray(questions) && questions.length > 0) {
                console.log(`Successfully parsed ${questions.length} questions from response.`);
                return questions;
            }
            throw new Error("Parsed JSON is not a valid array.");
        }
    }

    function generateFallbackQuestions(subject, topic) {
        const questions = [];
        for (let i = 1; i <= 10; i++) {
            const options = [
                `${topic} Concept ${i} - Mastered`,
                `Related topic in ${subject}`,
                `Common misconception about ${topic}`,
                `Alternative theory in ${subject}`
            ];
            // Randomize options and track correct index
            const originalCorrect = options[0];
            options.sort(() => Math.random() - 0.5);
            const correctIndex = options.indexOf(originalCorrect);

            questions.push({
                question: `Regarding ${topic} in ${subject}, what is the fundamental principle behind Question #${i}?`,
                options: options,
                correct: correctIndex
            });
        }
        return questions;
    }

    startMcqBtn.addEventListener('click', async () => {
        const topic = mcqTopicInput.value.trim();
        if (!topic) {
            alert("Please enter the topic you studied.");
            return;
        }

        // Show loading state
        startMcqBtn.disabled = true;
        mcqLoadingText.style.display = 'block';
        mcqLoadingText.innerHTML = '<span class="spinner">⏳</span> Generating AI Questions...';

        mcqQuestions = await generateMCQ(currentTaskForMCQ.subject, topic);
        currentQuestionIndex = 0;
        score = 0;

        // Hide loading state only if no error was shown, or after a delay
        setTimeout(() => {
            startMcqBtn.disabled = false;
            mcqLoadingText.style.display = 'none';
            
            mcqSetupInputs.style.display = 'none';
            mcqTestArea.style.display = 'block';
            document.getElementById('mcq-info').textContent = `${currentTaskForMCQ.subject}: ${topic}`;
            nextMcqBtn.textContent = "Next Question";
            showMCQQuestion();
        }, mcqLoadingText.innerHTML.includes('⚠️') ? 3000 : 500);
    });


    function showMCQQuestion() {
        const qData = mcqQuestions[currentQuestionIndex];
        const container = document.getElementById('mcq-question-card');
        document.getElementById('current-question-num').textContent = currentQuestionIndex + 1;

        container.innerHTML = `
            <div class="mcq-q-text"><strong>${qData.question}</strong></div>
            <div class="mcq-options">
                ${qData.options.map((opt, i) => `
                    <div class="mcq-option" data-index="${i}">${opt}</div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.mcq-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.mcq-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        if (currentQuestionIndex === 9) {
            nextMcqBtn.textContent = "Submit Test";
        }
    }

    nextMcqBtn.addEventListener('click', () => {
        const selected = document.querySelector('.mcq-option.selected');
        if (!selected) {
            alert("Please select an option!");
            return;
        }

        if (parseInt(selected.dataset.index) === mcqQuestions[currentQuestionIndex].correct) {
            score++;
        }

        if (currentQuestionIndex < 9) {
            currentQuestionIndex++;
            showMCQQuestion();
        } else {
            showMCQResults();
        }
    });

    function showMCQResults() {
        mcqModal.classList.remove('active');
        mcqResultModal.classList.add('active');
        document.getElementById('mcq-score').textContent = score;

        // --- Subject-wise Progress Tracking ---
        if (currentTaskForMCQ) {
            const subject = currentTaskForMCQ.subject;
            const percentage = (score / 10) * 100;
            // Update performance for this subject
            subjectProgress[subject] = percentage;
            localStorage.setItem('subjectProgress', JSON.stringify(subjectProgress));
            
            // Refresh progress bars in the UI
            updateProgressTracker();
        }

        // --- Progress Evaluation System ---
        const percentage = (score / 10) * 100;
        const quizProgressBar = document.getElementById('quiz-progress-bar');
        const quizPercentage = document.getElementById('quiz-percentage');
        const quizStatus = document.getElementById('quiz-status');

        // Update Percentage and Bar
        quizPercentage.textContent = `${percentage}% Performance`;
        quizProgressBar.style.width = `${percentage}%`;

        // Update Result Status
        if (score === 10) {
            quizStatus.textContent = "Excellent";
            quizStatus.style.color = "#2ecc71"; // Green
        } else if (score >= 8) {
            quizStatus.textContent = "Good";
            quizStatus.style.color = "#3498db"; // Blue
        } else if (score >= 6) {
            quizStatus.textContent = "Average";
            quizStatus.style.color = "#f39c12"; // Orange
        } else {
            quizStatus.textContent = "Need Improvement";
            quizStatus.style.color = "#e74c3c"; // Red
        }

        const msg = document.getElementById('mcq-result-message');
        if (score === 10) {
            msg.textContent = "Perfect! Task completed and progress unlocked.";
            mcqFinishBtn.style.display = 'none'; // Hide finish button as we use OK now
            mcqRetryBtn.style.display = 'none';
            mcqOkBtn.style.display = 'block';
            
            // Mark task as complete immediately if score is 10
            if (currentTaskForMCQ) {
                currentTaskForMCQ.completed = true;
                updateStreak();
                saveAndRefresh();
            }
        } else {
            msg.textContent = "Score 10/10 required to unlock progress. Complete the test again.";
            mcqFinishBtn.style.display = 'none';
            mcqRetryBtn.style.display = 'block';
            mcqOkBtn.style.display = 'block';
        }
    }

    function returnToDashboard() {
        mcqResultModal.classList.remove('active');
        showPage('dashboard');
        updateDashboard();
        updateProgressTracker();
    }

    mcqOkBtn.addEventListener('click', () => {
        returnToDashboard();
    });

    mcqRetryBtn.addEventListener('click', () => {
        mcqResultModal.classList.remove('active');
        openMCQModal(currentTaskForMCQ);
    });

    mcqFinishBtn.addEventListener('click', () => {
        currentTaskForMCQ.completed = true;
        updateStreak();
        saveAndRefresh();
        mcqResultModal.classList.remove('active');
    });

    mcqCloseBtn.addEventListener('click', () => {
        mcqResultModal.classList.remove('active');
    });

    if (closeMcqModal) {
        closeMcqModal.addEventListener('click', () => {
            mcqModal.classList.remove('active');
        });
    }

    // --- Reset Logic ---
    function resetPlanner() {
        if (confirm("Are you sure? This will delete all your subjects, plan, and progress.")) {
            // 1. Clear LocalStorage (only planner-related)
            localStorage.removeItem('studyPlan');
            localStorage.removeItem('streak');
            localStorage.removeItem('lastCompletionDate');
            localStorage.removeItem('subjectProgress');
            
            // 2. Reset In-Memory State
            studyPlan = [];
            streak = 0;
            subjectProgress = {};
            
            // 3. Clear UI Elements
            // Reset Planner Steps
            subjectCountInput.value = 1;
            totalStudyHoursInput.value = 4;
            subjectDetailsContainer.innerHTML = '';
            goToStep(1);
            
            // Clear Timetable
            timetable.innerHTML = '<p class="text-center">No tasks planned yet. Use the planner above to generate a schedule.</p>';
            rescheduleBtn.style.display = 'none';
            
            // 4. Update Dashboard & Progress Tracker
            updateDashboard();
            updateProgressTracker();
            
            alert("Planner Reset Successfully");
        }
    }

    if (headerResetBtn) headerResetBtn.addEventListener('click', resetPlanner);
    if (sidebarResetBtn) sidebarResetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetPlanner();
    });

    // --- Dashboard & Progress Tracker ---
    function updateDashboard() {
        document.getElementById('streak-count').textContent = streak;
        document.getElementById('quote').textContent = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

        const todayStr = new Date().toISOString().split('T')[0];
        const todayTasks = studyPlan.filter(t => t.date === todayStr);
        const taskList = document.getElementById('today-tasks');
        taskList.innerHTML = '';

        if (todayTasks.length === 0) {
            taskList.innerHTML = '<li>No tasks for today!</li>';
        } else {
            todayTasks.forEach(t => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.marginBottom = '10px';
                li.innerHTML = `
                    <input type="checkbox" disabled ${t.completed ? 'checked' : ''} style="margin-right: 10px;">
                    <span style="${t.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${t.subject}: ${t.hours}h</span>
                `;
                taskList.appendChild(li);
            });
        }

        // --- Overall Progress Calculation (Average of Subject Performance) ---
        const subjects = [...new Set(studyPlan.map(t => t.subject))];
        const totalSubjects = subjects.length;
        
        let totalProgress = 0;
        subjects.forEach(sub => {
            totalProgress += subjectProgress[sub] || 0;
        });

        const percent = totalSubjects > 0 ? Math.round(totalProgress / totalSubjects) : 0;
        
        const progressBar = document.getElementById('overall-progress-bar');
        const progressText = document.getElementById('overall-progress-text');
        
        if (progressBar) progressBar.style.width = percent + "%";
        if (progressText) progressText.textContent = percent;
    }

    function updateProgressTracker() {
        const subjects = [...new Set(studyPlan.map(t => t.subject))];
        const totalSubjects = subjects.length;
        
        let totalProgress = 0;
        subjects.forEach(sub => {
            totalProgress += subjectProgress[sub] || 0;
        });

        const percent = totalSubjects > 0 ? Math.round(totalProgress / totalSubjects) : 0;

        const completionText = document.getElementById('overall-completion-text');
        const circle = document.getElementById('overall-progress-circle');
        
        if (completionText) completionText.textContent = percent;
        if (circle) {
            circle.style.background = `conic-gradient(var(--primary-color) ${percent * 3.6}deg, var(--secondary-color) 0deg)`;
            circle.innerHTML = `<span>${percent}%</span>`;
        }

        const totalTasks = studyPlan.length;
        const completedTasks = studyPlan.filter(t => t.completed).length;
        const completedCountEl = document.getElementById('completed-tasks-count');
        const pendingCountEl = document.getElementById('pending-tasks-count');
        
        if (completedCountEl) completedCountEl.textContent = completedTasks;
        if (pendingCountEl) pendingCountEl.textContent = totalTasks - completedTasks;

        // Subject-wise progress
        const subBars = document.getElementById('subject-progress-bars');
        if (subBars) {
            subBars.innerHTML = '';
            subjects.forEach(sub => {
                const subTasks = studyPlan.filter(t => t.subject === sub);
                const subComp = subTasks.filter(t => t.completed).length;
                const subCompPerc = Math.round((subComp / subTasks.length) * 100);
                
                // Get performance percentage from subjectProgress state
                const perfPerc = subjectProgress[sub] || 0;

                const container = document.createElement('div');
                container.style.marginBottom = '20px';
                container.innerHTML = `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600;">
                        <span>${sub}</span>
                        <span style="color: var(--primary-color);">${perfPerc}% Performance</span>
                    </div>
                    <div class="progress-bar-container" style="height: 10px; background: rgba(0,0,0,0.05);">
                        <div class="progress-bar" style="width: ${perfPerc}%; height: 100%;"></div>
                    </div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                        Tasks Completion: ${subCompPerc}%
                    </div>
                `;
                subBars.appendChild(container);
            });
        }
    }

    function updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = localStorage.getItem('lastCompletionDate');

        if (lastDate === today) return; // Already updated today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            streak++;
        } else {
            streak = 1;
        }

        localStorage.setItem('streak', streak);
        localStorage.setItem('lastCompletionDate', today);
    }

    function saveAndRefresh() {
        localStorage.setItem('studyPlan', JSON.stringify(studyPlan));
        displayPlan();
        updateDashboard();
        updateProgressTracker();
    }

    // --- Initialize ---
    console.log("Initializing pLANWISE...");
    try {
        checkAuth();
        displayPlan();
        console.log("Initialization complete.");
    } catch (error) {
        console.error("Initialization failed:", error);
    }
});
