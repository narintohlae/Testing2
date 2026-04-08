/**
 * ZenTime 2026 - Modern Employee Time Tracker
 * Core Logic Module
 */

class ZenTimeApp {
    constructor() {
        this.state = {
            isClockedIn: false,
            startTime: null,
            timerInterval: null,
            logs: [],
            currentView: 'home',
            user: {
                name: 'นรินทร์',
                role: 'หัวหน้าทีมพัฒนา'
            }
        };

        this.init();
    }

    init() {
        this.loadState();
        this.setupEventListeners();
        this.renderCurrentDate();
        this.updateHistoryUI();
        this.initStats();
        
        // Resume timer if was clocked in
        if (this.state.isClockedIn) {
            this.resumeTimer();
        }
    }

    loadState() {
        const saved = localStorage.getItem('zentime_state');
        if (saved) {
            const data = JSON.parse(saved);
            this.state.isClockedIn = data.isClockedIn || false;
            this.state.startTime = data.startTime ? new Date(data.startTime) : null;
            this.state.logs = data.logs || [];
        } else {
            // Initial Seed for demo
            this.state.logs = [
                { date: '2026-04-07', start: '08:30', end: '17:45', duration: '9h 15m' },
                { date: '2026-04-06', start: '09:00', end: '18:00', duration: '9h 00m' }
            ];
            this.saveState();
        }
    }

    saveState() {
        localStorage.setItem('zentime_state', JSON.stringify({
            isClockedIn: this.state.isClockedIn,
            startTime: this.state.startTime,
            logs: this.state.logs
        }));
    }

    setupEventListeners() {
        // Clock In/Out Button
        document.getElementById('clock-btn').addEventListener('click', () => this.toggleClock());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
    }

    renderCurrentDate() {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dateStr = new Date().toLocaleDateString('th-TH', options);
        document.getElementById('current-date').textContent = dateStr;
    }

    toggleClock() {
        if (!this.state.isClockedIn) {
            this.clockIn();
        } else {
            this.clockOut();
        }
    }

    clockIn() {
        this.state.isClockedIn = true;
        this.state.startTime = new Date();
        this.saveState();
        this.updateTimerUI();
        this.startTick();
        
        // UI Feedback
        const btn = document.getElementById('clock-btn');
        btn.classList.remove('clock-in');
        btn.classList.add('clock-out');
        btn.querySelector('.btn-text').textContent = 'Clock Out';
        document.getElementById('timer-status-dot').classList.add('active');
        document.getElementById('timer-label').textContent = 'กำลังทำงานอยู่...';
    }

    clockOut() {
        const endTime = new Date();
        const durationMs = endTime - this.state.startTime;
        const durationStr = this.formatDuration(durationMs);

        // Save log
        const log = {
            date: this.state.startTime.toISOString().split('T')[0],
            start: this.formatTime(this.state.startTime),
            end: this.formatTime(endTime),
            duration: durationStr
        };

        this.state.logs.unshift(log);
        this.state.isClockedIn = false;
        this.state.startTime = null;
        clearInterval(this.state.timerInterval);
        
        this.saveState();
        this.updateHistoryUI();
        this.initStats();

        // UI Reset
        const btn = document.getElementById('clock-btn');
        btn.classList.remove('clock-out');
        btn.classList.add('clock-in');
        btn.querySelector('.btn-text').textContent = 'Clock In';
        document.getElementById('timer-status-dot').classList.remove('active');
        document.getElementById('main-timer').textContent = '00:00:00';
        document.getElementById('timer-label').textContent = 'พร้อมสำหรับการเข้างาน';
    }

    resumeTimer() {
        this.updateTimerUI();
        this.startTick();
        
        const btn = document.getElementById('clock-btn');
        btn.classList.remove('clock-in');
        btn.classList.add('clock-out');
        btn.querySelector('.btn-text').textContent = 'Clock Out';
        document.getElementById('timer-status-dot').classList.add('active');
        document.getElementById('timer-label').textContent = 'กำลังทำงานอยู่...';
    }

    startTick() {
        this.state.timerInterval = setInterval(() => {
            this.updateTimerUI();
        }, 1000);
    }

    updateTimerUI() {
        if (!this.state.startTime) return;
        const now = new Date();
        const diff = now - this.state.startTime;
        document.getElementById('main-timer').textContent = this.formatDisplayTimer(diff);
    }

    formatDisplayTimer(ms) {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }

    formatDuration(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        return `${hours}h ${minutes}m`;
    }

    formatTime(date) {
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    switchView(viewId) {
        // UI Navigation Update
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });

        // Current View Logic
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewId}-view`);
        });

        this.state.currentView = viewId;
        
        if (viewId === 'history') {
            this.updateHistoryUI();
        } else if (viewId === 'admin') {
            this.updateAdminUI();
        }
    }

    updateAdminUI() {
        const list = document.getElementById('employee-list');
        if (!list) return;

        const employees = [
            { name: 'สมชาย วิริยะ', status: 'In', time: '08:45', avatar: '1' },
            { name: 'วิภา สายชาร์จ', status: 'In', time: '09:02', avatar: '2' },
            { name: 'มานะ อดทน', status: 'Out', time: '17:30', avatar: '3' },
            { name: 'กิตติ ใจดี', status: 'In', time: '08:50', avatar: '4' }
        ];

        list.innerHTML = employees.map(emp => `
            <div class="employee-card glass">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emp${emp.avatar}" class="emp-avatar">
                <div class="emp-info">
                    <div class="emp-name">${emp.name}</div>
                    <div class="emp-status">เข้างานเมื่อ ${emp.time}</div>
                </div>
                <div class="status-badge ${emp.status.toLowerCase()}">${emp.status}</div>
            </div>
        `).join('');
    }

    updateHistoryUI() {
        const list = document.getElementById('history-list');
        if (!list) return;

        list.innerHTML = this.state.logs.map(log => `
            <div class="history-item glass">
                <div class="h-info">
                    <div class="h-date">${this.formatThaiDate(log.date)}</div>
                    <div class="h-time">${log.start} - ${log.end}</div>
                </div>
                <div class="h-duration">${log.duration}</div>
            </div>
        `).join('');
    }

    formatThaiDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    initStats() {
        // Mock stats update
        const totalHours = this.state.logs.reduce((acc, curr) => {
            const [h, m] = curr.duration.replace('h', '').replace('m', '').trim().split(' ');
            return acc + parseInt(h) + (parseInt(m) / 60);
        }, 0);
        
        const statElements = document.querySelectorAll('.stat-value');
        if (statElements[0]) statElements[0].textContent = totalHours.toFixed(1);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ZenTimeApp();
});
