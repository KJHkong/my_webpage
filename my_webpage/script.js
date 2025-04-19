document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const resetButton = document.getElementById('reset-chat');
    const toggleButton = document.getElementById('toggle-chat');
    const pauseButton = document.getElementById('pause-chat');
    const navBar = document.querySelector('.nav-bar');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const canvas = document.getElementById('stars');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');

    // 状态变量
    let isTyping = false;
    let chatHistory = [];
    let currentSlide = 0;
    let slideInterval;
    let isPaused = false;
    let typeInterval = null;
    let currentTypeIndex = 0;
    let currentTypeText = '';
    let currentTypeElement = null;

    // 初始化
    initialize();

    // 初始化函数
    function initialize() {
        // 聊天功能事件监听
        initChatEvents();
        
        // 导航条事件监听
        initNavEvents();
        
        // 照片轮播初始化
        initCarousel();
        
        // 星空背景初始化
        initStarryBackground();
        
        // 滚动动画初始化
        initScrollAnimation();

        // 初始化二维码点击事件
        initQRCodeEvents();
    }

    // 初始化二维码点击事件
    function initQRCodeEvents() {
        // 获取所有社交图标链接
        const socialLinks = document.querySelectorAll('.social-icon');
        
        // 为每个链接添加点击事件
        socialLinks.forEach(link => {
            // 只为微信和QQ的链接添加事件
            if (link.querySelector('.fa-weixin') || link.querySelector('.fa-qq')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const imgSrc = this.getAttribute('href');
                    showModal(imgSrc);
                });
            }
        });
        
        // 关闭模态框
        closeModal.addEventListener('click', hideModal);
        
        // 点击模态框背景也可以关闭
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) {
                hideModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && imageModal.style.display === 'block') {
                hideModal();
            }
        });
    }

    // 显示模态框
    function showModal(imgSrc) {
        modalImage.src = imgSrc;
        imageModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    // 隐藏模态框
    function hideModal() {
        imageModal.style.display = 'none';
        document.body.style.overflow = 'auto'; // 恢复背景滚动
    }

    // 聊天功能初始化
    function initChatEvents() {
        toggleButton.addEventListener('click', toggleChatSize);
        pauseButton.addEventListener('click', togglePause);
        resetButton.addEventListener('click', resetChat);
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('input', handleInput);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (sendButton.disabled === false) {
                    sendMessage();
                }
            }
        });

        // 点击聊天头部也可以切换大小
        document.querySelector('.chat-header').addEventListener('click', (e) => {
            // 排除点击按钮的情况
            if (!e.target.closest('button')) {
                toggleChatSize();
            }
        });
    }

    // 切换聊天窗口大小
    function toggleChatSize() {
        chatContainer.classList.toggle('minimized');
        const icon = toggleButton.querySelector('i');
        icon.classList.toggle('rotated');
    }

    // 暂停/继续AI回复
    function togglePause() {
        isPaused = !isPaused;
        pauseButton.classList.toggle('active');
        
        if (isPaused) {
            // 暂停打字效果
            if (typeInterval) {
                clearInterval(typeInterval);
                typeInterval = null;
            }
            pauseButton.querySelector('i').classList.remove('fa-pause');
            pauseButton.querySelector('i').classList.add('fa-play');
            pauseButton.title = "继续回答";
        } else {
            // 继续打字效果
            if (currentTypeElement && currentTypeText) {
                typeText(currentTypeElement, currentTypeText, currentTypeIndex);
            }
            pauseButton.querySelector('i').classList.remove('fa-play');
            pauseButton.querySelector('i').classList.add('fa-pause');
            pauseButton.title = "暂停回答";
        }
    }

    // 导航条事件初始化
    function initNavEvents() {
        // 滚动时改变导航条样式
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navBar.classList.add('scrolled');
            } else {
                navBar.classList.remove('scrolled');
            }
        });
        
        // 移动端菜单切换
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // 切换图标
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // 点击链接后关闭移动端菜单
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // 照片轮播初始化
    function initCarousel() {
        const slides = document.querySelectorAll('.carousel-slide');
        const prevButton = document.querySelector('.carousel-button.prev');
        const nextButton = document.querySelector('.carousel-button.next');
        const indicators = document.querySelectorAll('.carousel-indicator');
        
        if (slides.length === 0) return;
        
        // 设置自动轮播
        startSlideInterval();
        
        // 点击切换上一张
        prevButton.addEventListener('click', () => {
            clearInterval(slideInterval);
            changeSlide(currentSlide - 1);
            startSlideInterval();
        });
        
        // 点击切换下一张
        nextButton.addEventListener('click', () => {
            clearInterval(slideInterval);
            changeSlide(currentSlide + 1);
            startSlideInterval();
        });
        
        // 指示器点击切换
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                clearInterval(slideInterval);
                changeSlide(index);
                startSlideInterval();
            });
        });
        
        // 设置自动轮播间隔
        function startSlideInterval() {
            slideInterval = setInterval(() => {
                changeSlide(currentSlide + 1);
            }, 5000); // 5秒切换一次
        }
        
        // 切换幻灯片函数
        function changeSlide(index) {
            // 移除当前激活状态
            slides[currentSlide].classList.remove('active');
            indicators[currentSlide].classList.remove('active');
            
            // 计算新的索引 (循环)
            currentSlide = (index + slides.length) % slides.length;
            
            // 添加新的激活状态
            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
        }
    }

    // 星空背景初始化
    function initStarryBackground() {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const stars = [];
        const count = 100;
        
        // 调整canvas大小为窗口大小
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        // 创建星星
        function createStars() {
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5 + 0.5,
                    color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`,
                    speed: Math.random() * 0.05,
                    angle: Math.random() * Math.PI * 2
                });
            }
        }
        
        // 绘制星星
        function drawStars() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.fill();
                
                // 移动星星
                star.x += Math.cos(star.angle) * star.speed;
                star.y += Math.sin(star.angle) * star.speed;
                
                // 如果星星移出视野，重新放置
                if (star.x < 0 || star.x > canvas.width || star.y < 0 || star.y > canvas.height) {
                    star.x = Math.random() * canvas.width;
                    star.y = Math.random() * canvas.height;
                    star.angle = Math.random() * Math.PI * 2;
                }
            });
            
            requestAnimationFrame(drawStars);
        }
        
        // 初始化星空
        resizeCanvas();
        createStars();
        drawStars();
        
        // 窗口大小改变时调整canvas大小
        window.addEventListener('resize', () => {
            resizeCanvas();
            stars.length = 0;
            createStars();
        });
    }

    // 滚动动画初始化
    function initScrollAnimation() {
        const elements = document.querySelectorAll('.slide-in-left, .slide-in-right, .slide-in-bottom');
        
        function checkScroll() {
            elements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const triggerPoint = window.innerHeight * 0.8;
                
                if (elementTop < triggerPoint) {
                    element.classList.add('slide-in');
                }
            });
        }
        
        // 初次检查
        checkScroll();
        
        // 滚动时检查
        window.addEventListener('scroll', checkScroll);
    }

    // 重置聊天
    function resetChat() {
        if (confirm('确定要清空所有聊天记录吗？')) {
            chatMessages.innerHTML = '';
            chatHistory = [];
            // 添加欢迎消息
            addMessage('你好！我是孔嘉浩的AI助手。我可以回答数学和人工智能领域的问题，也可以聊聊其他话题。有什么我能帮到你的吗？', 'ai');
            
            // 记录系统消息到聊天历史（这将在下一次API调用时使用）
            chatHistory = [
                { role: 'assistant', content: '你好！我是孔嘉浩的AI助手。我可以回答数学和人工智能领域的问题，也可以聊聊其他话题。有什么我能帮到你的吗？' }
            ];
        }
    }

    // 发送消息
    async function sendMessage() {
        const message = userInput.value.trim();
        
        if (message && !isTyping) {
            // 添加用户消息到聊天窗口
            addMessage(message, 'user');
            
            // 清空输入框
            userInput.value = '';
            userInput.style.height = 'auto';
            
            // 禁用发送按钮
            updateSendButton();
            
            // 调用AI回复函数
            await getAIResponse(message);
        }
    }

    // 添加消息到聊天窗口
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        const timeDiv = document.createElement('div');
        timeDiv.classList.add('message-time');
        timeDiv.textContent = getCurrentTime();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        chatMessages.appendChild(messageDiv);
        
        if (sender === 'ai') {
            // 为AI消息添加打字效果
            typeText(contentDiv, text, 0);
        } else {
            // 用户消息直接显示
            contentDiv.textContent = text;
        }
        
        scrollToBottom();
    }

    // 打字效果，支持暂停/继续
    function typeText(element, text, startIndex = 0) {
        isTyping = true;
        element.classList.add('typing-animation');
        
        // 存储当前打字状态，以便暂停后继续
        currentTypeElement = element;
        currentTypeText = text;
        currentTypeIndex = startIndex;
        
        // 如果已经暂停，则不开始打字
        if (isPaused) {
            element.textContent = text.substring(0, startIndex);
            return;
        }
        
        const speed = 30; // 打字速度（毫秒/字符）
        
        // 清除之前的定时器
        if (typeInterval) {
            clearInterval(typeInterval);
        }
        
        if (startIndex === 0) {
            element.textContent = '';
            // 短暂延迟后开始打字
            setTimeout(() => {
                if (!isPaused) {
                    typeInterval = setInterval(typeNextChar, speed);
                }
            }, 500);
        } else {
            // 继续之前的打字
            typeInterval = setInterval(typeNextChar, speed);
        }
        
        function typeNextChar() {
            if (currentTypeIndex < text.length) {
                element.textContent += text.charAt(currentTypeIndex);
                currentTypeIndex++;
                scrollToBottom();
            } else {
                // 打字完成
                clearInterval(typeInterval);
                typeInterval = null;
                element.classList.remove('typing-animation');
                isTyping = false;
                
                // 重置当前打字状态
                currentTypeElement = null;
                currentTypeText = '';
                currentTypeIndex = 0;
            }
        }
    }

    // 显示"AI正在输入"的指示器
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('message', 'ai-message', 'loading-indicator');
        indicator.innerHTML = 'AI正在思考<div class="loading-dots"><span></span><span></span><span></span></div>';
        indicator.id = 'typing-indicator';
        chatMessages.appendChild(indicator);
        scrollToBottom();
    }

    // 隐藏"AI正在输入"的指示器
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 获取AI响应（使用DeepSeek API）
    async function getAIResponse(userMessage) {
        // 显示AI正在输入的指示
        showTypingIndicator();
        
        try {
            // 记录聊天历史
            chatHistory.push({ role: 'user', content: userMessage });
            
            // 准备发送到DeepSeek API的消息
            const messages = [
                { role: 'system', content: '你是孔嘉浩的AI助手，一个友好、专业且乐于助人的助手。孔嘉浩是数学与应用数学专业本科二年级学生，对AI领域非常感兴趣。你应该擅长回答数学和人工智能领域的问题，包括但不限于：数学计算、数学概念解释、AI模型原理、机器学习算法、深度学习技术等。对于用户提出的其他领域的问题，你也应该尽可能专业、友好地回答。回答要礼貌、专业，并尽可能提供有用的信息。' },
                ...chatHistory
            ];
            
            // 调用DeepSeek API
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-a15988bc79e74ac5894538cea0c4b992'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 800
                })
            });
            
            // 检查API响应
            if (!response.ok) {
                throw new Error(`API响应错误: ${response.status}`);
            }
            
            // 解析API响应
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            // 移除输入指示器
            hideTypingIndicator();
            
            // 添加AI回复到聊天窗口
            addMessage(aiResponse, 'ai');
            
            // 记录聊天历史
            chatHistory.push({ role: 'assistant', content: aiResponse });
            
        } catch (error) {
            console.error('API调用失败:', error);
            
            // 移除输入指示器
            hideTypingIndicator();
            
            // 显示错误消息
            addMessage('抱歉，我暂时无法连接到服务器。请稍后再试。', 'ai');
            
            // 记录错误到聊天历史
            chatHistory.push({ role: 'assistant', content: '抱歉，我暂时无法连接到服务器。请稍后再试。' });
        }
    }

    // 保留原有的模拟函数作为备用（如果API不可用）
    function generateMockResponse(userMessage) {
        // 这里可以替换为实际的AI API调用
        const responses = [
            "作为数学与人工智能领域的助手，我很乐意解答这个问题。",
            "这是个很好的问题！从数学角度来看...",
            "在AI领域中，这个问题有着有趣的应用...",
            "数学和AI的结合点在这个问题上体现得很好。",
            "从理论和应用两个角度，我可以这样解释...",
            "这个概念在机器学习中非常重要，因为...",
            "作为孔嘉浩的助手，我可以分享一些他在数学和AI学习中的见解...",
            "这个问题涉及到一些有趣的算法思想，让我解释一下...",
            "在处理这类问题时，数学模型可以这样构建...",
            "AI系统处理这类问题的方式很有启发性..."
        ];
        
        // 关键词匹配
        if (userMessage.toLowerCase().includes('你好') || userMessage.toLowerCase().includes('嗨')) {
            return "你好！我是孔嘉浩的AI助手。我可以回答数学和人工智能领域的问题，也可以聊聊其他话题。有什么我能帮到你的吗？";
        } else if (userMessage.toLowerCase().includes('孔嘉浩')) {
            return "孔嘉浩是一位数学与应用数学专业的二年级本科生，对人工智能领域有着浓厚的兴趣。他正在探索数学理论在AI中的应用，希望能在这个交叉领域有所建树。";
        } else if (userMessage.toLowerCase().includes('数学')) {
            return "数学是理解人工智能和机器学习的基础。从线性代数、微积分到概率统计，这些数学分支都在AI算法中扮演着关键角色。孔嘉浩正在深入学习这些知识，并尝试将它们应用到实际问题中。有什么具体的数学概念您想了解吗？";
        } else if (userMessage.toLowerCase().includes('人工智能') || userMessage.toLowerCase().includes('ai')) {
            return "人工智能是当今最热门的技术领域之一，它结合了数学、计算机科学和认知科学等多学科知识。孔嘉浩特别关注深度学习、自然语言处理等AI分支，并且在学习如何将数学理论应用到这些领域中。您对AI的哪个方面特别感兴趣呢？";
        } else if (userMessage.toLowerCase().includes('谢谢') || userMessage.toLowerCase().includes('感谢')) {
            return "不客气！很高兴能帮到您。如果您有关于数学、AI或其他任何问题，随时可以问我。";
        } else if (userMessage.toLowerCase().includes('再见')) {
            return "再见！祝您学习和研究顺利。有任何问题随时回来找我聊天。";
        } else if (/^\s*\d+\s*[\+\-\*\/]\s*\d+\s*$/.test(userMessage)) {
            // 简单的算术计算
            try {
                return `计算结果是: ${eval(userMessage)}`;
            } catch (e) {
                return "抱歉，我无法计算这个表达式。请检查格式是否正确。";
            }
        } else {
            // 随机选择一个通用回复
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            return `${randomResponse} 关于"${userMessage.substring(0, 15)}${userMessage.length > 15 ? '...' : ''}"，我很乐意从数学和AI的角度进一步探讨。如果您有更具体的问题，我可以提供更详细的解答。`;
        }
    }

    // 处理API失败时的回退函数
    function handleAPIFailure(userMessage) {
        console.warn('回退到模拟回复');
        const mockResponse = generateMockResponse(userMessage);
        
        // 添加模拟回复到聊天窗口
        addMessage(mockResponse, 'ai');
        
        // 记录聊天历史
        chatHistory.push({ role: 'assistant', content: mockResponse });
    }

    // 处理输入变化，更新发送按钮状态
    function handleInput() {
        updateSendButton();
        
        // 自动调整文本框高度
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight > 100 ? 100 : userInput.scrollHeight) + 'px';
    }

    // 更新发送按钮状态
    function updateSendButton() {
        sendButton.disabled = userInput.value.trim() === '' || isTyping;
    }

    // 获取当前时间
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        
        // 添加前导零
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${hours}:${minutes}`;
    }

    // 滚动到最新消息
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}); 