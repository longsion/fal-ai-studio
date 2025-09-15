class ImageGeneratorApp {
    constructor() {
        this.currentParameters = {
            imageSize: 'landscape_4_3',
            steps: 4,
            numImages: 1,
            safetyChecker: true
        };
        
        this.conversationHistory = [];
        this.sessions = [];
        this.currentSessionId = null;
        this.supportedModels = {};
        this.isGenerating = false; // 防重复生成标志
        this.selectedImageUrl = null; // 选中的图片URL
        this.selectedImageFile = null; // 选中的图片文件
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadSettings();
        this.loadSessions();
        this.loadSupportedModels();
        this.updateParameterDisplays();
        this.createNewSession();
        this.initResizer();
    }

    bindEvents() {
        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cancel-settings').addEventListener('click', () => {
            this.hideSettingsModal();
        });

        // Parameters modal
        document.getElementById('parameters-btn').addEventListener('click', () => {
            this.showParametersModal();
        });

        document.getElementById('apply-parameters').addEventListener('click', () => {
            this.applyParameters();
        });

        document.getElementById('cancel-parameters').addEventListener('click', () => {
            this.hideParametersModal();
        });

        // Close modal when clicking X or outside
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.style.display = 'none';
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.removeEventListener('click', this.handleGenerateClick);
        this.handleGenerateClick = () => this.generateImage();
        generateBtn.addEventListener('click', this.handleGenerateClick);

        // Enter key in prompt input - 只处理普通 Enter，Ctrl/Cmd+Enter 由全局快捷键处理
        const promptInput = document.getElementById('prompt-input');
        promptInput.removeEventListener('keydown', this.handleKeyDown);
        this.handleKeyDown = (e) => {
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                // 普通 Enter 键，可以用于换行或其他功能
                // 这里暂时不做任何操作，保持原有行为
            }
        };
        promptInput.addEventListener('keydown', this.handleKeyDown);

        // New session and history buttons
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.createNewSession();
        });

        document.getElementById('sessions-btn').addEventListener('click', () => {
            this.showSessionsModal();
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            this.showWelcomeMessage();
        });

        // Sessions modal
        document.getElementById('close-sessions').addEventListener('click', () => {
            this.hideSessionsModal();
        });

        document.getElementById('clear-sessions').addEventListener('click', () => {
            this.clearAllSessions();
        });

        // Model info button
        document.getElementById('model-info-btn').addEventListener('click', () => {
            this.showModelInfoModal();
        });

        document.getElementById('close-model-info').addEventListener('click', () => {
            this.hideModelInfoModal();
        });

        // Parameter range inputs
        document.getElementById('steps').addEventListener('input', (e) => {
            document.getElementById('steps-value').textContent = e.target.value;
        });

        document.getElementById('num-images').addEventListener('input', (e) => {
            document.getElementById('num-images-value').textContent = e.target.value;
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalShortcuts(e);
        });

        // Model selection change
        document.getElementById('model-select').addEventListener('change', (e) => {
            this.handleModelChange(e.target.value);
        });

        // Image upload handling
        document.getElementById('image-input').addEventListener('change', (e) => {
            this.handleImageSelect(e);
        });

        // Remove selected image
        document.getElementById('remove-image-btn').addEventListener('click', () => {
            this.removeSelectedImage();
        });
    }

    async loadSettings() {
        try {
            const falApiKey = await window.electronAPI.getConfig('falApiKey');
            if (falApiKey) {
                document.getElementById('fal-api-key').value = falApiKey;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    showSettingsModal() {
        document.getElementById('settings-modal').style.display = 'block';
    }

    hideSettingsModal() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    async saveSettings() {
        const falApiKey = document.getElementById('fal-api-key').value.trim();
        
        try {
            await window.electronAPI.setConfig('falApiKey', falApiKey);
            this.addMessage('system', '设置已保存');
            this.hideSettingsModal();
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.addMessage('system', '保存设置失败: ' + error.message);
        }
    }

    showParametersModal() {
        // Load current parameters into modal
        document.getElementById('image-size').value = this.currentParameters.imageSize;
        document.getElementById('steps').value = this.currentParameters.steps;
        document.getElementById('steps-value').textContent = this.currentParameters.steps;
        document.getElementById('num-images').value = this.currentParameters.numImages;
        document.getElementById('num-images-value').textContent = this.currentParameters.numImages;
        document.getElementById('safety-checker').checked = this.currentParameters.safetyChecker;
        
        document.getElementById('parameters-modal').style.display = 'block';
    }

    hideParametersModal() {
        document.getElementById('parameters-modal').style.display = 'none';
    }

    applyParameters() {
        this.currentParameters = {
            imageSize: document.getElementById('image-size').value,
            steps: parseInt(document.getElementById('steps').value),
            numImages: parseInt(document.getElementById('num-images').value),
            safetyChecker: document.getElementById('safety-checker').checked
        };
        
        this.addMessage('system', `参数已更新: ${this.getParameterSummary()}`);
        this.hideParametersModal();
    }

    getParameterSummary() {
        const sizeLabels = {
            'square_hd': '正方形 HD',
            'square': '正方形',
            'portrait_4_3': '竖版 4:3',
            'portrait_16_9': '竖版 16:9',
            'landscape_4_3': '横版 4:3',
            'landscape_16_9': '横版 16:9'
        };
        
        return `尺寸: ${sizeLabels[this.currentParameters.imageSize]}, 步数: ${this.currentParameters.steps}, 数量: ${this.currentParameters.numImages}`;
    }

    updateParameterDisplays() {
        document.getElementById('steps-value').textContent = this.currentParameters.steps;
        document.getElementById('num-images-value').textContent = this.currentParameters.numImages;
    }

    loadSupportedModels() {
        // 与后端imageGenerator.js保持一致的模型配置
        this.supportedModels = {
            'fal-nano-banana': {
                name: 'Fal.ai Nano Banana (默认)',
                description: '快速生成，适合快速预览',
                type: 'text-to-image'
            },
            'nano-banana-edit': {
                name: 'Nano Banana Edit (图片编辑)',
                description: 'Google图片编辑模型，快速修改图片',
                type: 'image-to-image'
            },
            'flux-schnell': {
                name: 'FLUX.1 [schnell]',
                description: '快速生成模型，速度优先',
                type: 'text-to-image'
            },
            'flux-dev': {
                name: 'FLUX.1 [dev]',
                description: '12B参数模型，高质量图像生成',
                type: 'text-to-image'
            },
            'flux-pro-ultra': {
                name: 'FLUX1.1 [pro] ultra',
                description: '专业级图像质量，支持2K分辨率',
                type: 'text-to-image'
            },
            'recraft-v3': {
                name: 'Recraft V3',
                description: '支持长文本、矢量艺术和品牌风格',
                type: 'text-to-image'
            },
            'ideogram-v2': {
                name: 'Ideogram V2',
                description: '优秀的排版处理和现实感输出',
                type: 'text-to-image'
            },
            'stable-diffusion-35': {
                name: 'Stable Diffusion 3.5 Large',
                description: '改进的图像质量和复杂提示理解',
                type: 'text-to-image'
            },
            'bria-3-2': {
                name: 'Bria 3.2',
                description: '商业安全，文本渲染优秀',
                type: 'text-to-image'
            },
            'imagen4-preview': {
                name: 'Imagen 4 Preview',
                description: 'Google最高质量图像生成模型',
                type: 'text-to-image'
            },
            // 图片编辑模型
            'seedream-edit': {
                name: 'Seedream 4.0 Edit',
                description: 'ByteDance最新图片编辑模型，集成生成和编辑功能',
                type: 'image-to-image'
            },
            'qwen-image-edit': {
                name: 'Qwen Image Edit',
                description: 'Qwen图片编辑模型，优秀的文字编辑能力',
                type: 'image-to-image'
            },
            'ideogram-character-edit': {
                name: 'Ideogram Character Edit',
                description: '修改角色形象，保持角色一致性',
                type: 'image-to-image'
            },
            'seededit-v3': {
                name: 'SeedEdit 3.0',
                description: 'ByteDance图片编辑模型，擅长处理真实图像',
                type: 'image-to-image'
            },
            'ideogram-v3-edit': {
                name: 'Ideogram V3 Edit',
                description: 'Ideogram V3编辑功能，高保真度图像修改',
                type: 'image-to-image'
            }
        };
    }

    loadSessions() {
        const savedSessions = localStorage.getItem('ai-image-sessions');
        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
        }
    }

    saveSessions() {
        localStorage.setItem('ai-image-sessions', JSON.stringify(this.sessions));
    }

    createNewSession() {
        const sessionId = 'session_' + Date.now();
        const newSession = {
            id: sessionId,
            title: '新对话',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.sessions.unshift(newSession);
        this.currentSessionId = sessionId;
        this.conversationHistory = [];
        
        this.showWelcomeMessage();
        this.saveSessions();
        this.updateBackButton();
    }

    loadSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            this.currentSessionId = sessionId;
            this.conversationHistory = session.messages;
            this.renderConversation();
            this.updateBackButton();
        }
    }

    updateCurrentSession() {
        if (this.currentSessionId) {
            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) {
                session.messages = [...this.conversationHistory];
                session.updatedAt = new Date();
                
                // Update title based on first user message
                if (this.conversationHistory.length > 0) {
                    const firstUserMessage = this.conversationHistory.find(m => m.role === 'user');
                    if (firstUserMessage) {
                        session.title = firstUserMessage.content.substring(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
                    }
                }
                
                this.saveSessions();
            }
        }
    }

    updateBackButton() {
        const backBtn = document.getElementById('back-btn');
        if (this.conversationHistory.length > 0) {
            backBtn.style.display = 'block';
        } else {
            backBtn.style.display = 'none';
        }
    }

    showWelcomeMessage() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <h3>欢迎使用 AI 图像生成器！</h3>
                <p>在下方输入您的图像描述，我将为您生成精美的图片。您可以：</p>
                <ul>
                    <li>描述您想要的图像内容</li>
                    <li>进行多轮对话来完善描述</li>
                    <li>调整生成参数</li>
                    <li>选择不同的AI模型</li>
                </ul>
                <div class="shortcuts-info">
                    <h4>⌨️ 快捷键：</h4>
                    <div class="shortcuts-grid">
                        <span><kbd>Ctrl/Cmd + Enter</kbd> 生成图像</span>
                        <span><kbd>Ctrl/Cmd + N</kbd> 新对话</span>
                        <span><kbd>Ctrl/Cmd + H</kbd> 历史会话</span>
                        <span><kbd>Ctrl/Cmd + ,</kbd> 设置</span>
                        <span><kbd>Ctrl/Cmd + P</kbd> 参数</span>
                        <span><kbd>Esc</kbd> 关闭弹窗</span>
                    </div>
                </div>
            </div>
        `;
        this.conversationHistory = [];
        this.updateBackButton();
    }

    renderConversation() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';
        
        if (this.conversationHistory.length === 0) {
            this.showWelcomeMessage();
            return;
        }

        this.conversationHistory.forEach(message => {
            if (message.role === 'user') {
                this.addMessage('user', message.content, false);
            } else if (message.role === 'assistant') {
                if (message.images) {
                    this.addGeneratedImages({
                        images: message.images,
                        prompt: message.content
                    }, false);
                } else {
                    this.addMessage('assistant', message.content, false);
                }
            } else if (message.role === 'system') {
                this.addMessage('system', message.content, false);
            }
        });
        
        this.updateBackButton();
    }

    async generateImage() {
        // 防重复生成
        if (this.isGenerating) {
            console.log('Already generating, skipping...');
            return;
        }

        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) {
            this.showNotification('请输入图像描述', 'warning');
            return;
        }

        const model = document.getElementById('model-select').value;
        const apiKey = await window.electronAPI.getConfig('falApiKey');
        
        if (!apiKey) {
            this.showNotification('请先在设置中配置 API Key', 'warning');
            this.showSettingsModal();
            return;
        }

        // 检查是否为图片编辑模型且需要选择图片
        const modelConfig = this.supportedModels[model];
        if (modelConfig && modelConfig.type === 'image-to-image' && !this.selectedImageUrl) {
            this.showNotification('请先选择要编辑的图片', 'warning');
            return;
        }

        // 设置生成中标志
        this.isGenerating = true;

        // Add user message to chat
        this.addMessage('user', prompt);
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: prompt,
            timestamp: new Date()
        });
        
        // Update current session
        this.updateCurrentSession();

        // Clear input
        document.getElementById('prompt-input').value = '';

        // Show loading
        this.showLoading();
        
        // Disable generate button
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';

        try {
            // 准备参数，如果是图片编辑模型则添加图片URL
            const parameters = { ...this.currentParameters };
            console.log('Current model:', model, 'Model config:', modelConfig);
            console.log('Current selectedImageUrl:', this.selectedImageUrl);
            
            if (modelConfig && modelConfig.type === 'image-to-image') {
                if (this.selectedImageUrl) {
                    parameters.imageUrl = this.selectedImageUrl;
                    console.log('Image editing mode - Selected image URL:', this.selectedImageUrl);
                    console.log('Parameters object:', parameters);
                } else {
                    console.error('Image editing mode but no image selected!');
                    this.showNotification('请先选择要编辑的图片', 'warning');
                    return;
                }
            }

            const result = await window.electronAPI.generateImage({
                model: model,
                prompt: prompt,
                apiKey: apiKey,
                parameters: parameters
            });

            this.hideLoading();
            
            if (result.success) {
                this.addGeneratedImages(result);
                this.conversationHistory.push({
                    role: 'assistant',
                    content: `已生成 ${result.images.length} 张图片`,
                    images: result.images,
                    timestamp: new Date()
                });
                
                // 自动选中最新生成的图片用于编辑
                if (result.images && result.images.length > 0) {
                    console.log('Generated images:', result.images);
                    this.autoSelectLatestImage(result.images[0].url);
                }
                
                // Update current session
                this.updateCurrentSession();
            } else {
                this.showNotification('图像生成失败: ' + (result.error || '未知错误'), 'error');
            }
        } catch (error) {
            this.hideLoading();
            console.error('Generation error:', error);
            
            // 更友好的错误提示
            let errorMessage = '生成失败';
            if (error.message.includes('API key')) {
                errorMessage = '请检查 API Key 是否正确配置';
            } else if (error.message.includes('No images returned')) {
                errorMessage = '模型未能生成图像，请尝试调整提示词或更换模型';
            } else if (error.message.includes('not found')) {
                errorMessage = '所选模型暂时不可用，请尝试其他模型';
            } else if (error.message.includes('quota') || error.message.includes('limit')) {
                errorMessage = 'API 配额已用完，请稍后再试';
            } else {
                errorMessage = `生成失败: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成图像';
            this.isGenerating = false; // 重置生成标志
        }
    }

    addMessage(type, content, shouldScroll = true) {
        const messagesContainer = document.getElementById('chat-messages');
        
        // Remove welcome message if it exists
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
        messagesContainer.appendChild(messageDiv);
        
        if (shouldScroll) {
            this.scrollToBottom();
        }
        
        this.updateBackButton();
    }

    addGeneratedImages(result, shouldScroll = true) {
        const messagesContainer = document.getElementById('chat-messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';
        
        const textDiv = document.createElement('div');
        textDiv.textContent = `已为您生成 ${result.images.length} 张图片：`;
        messageDiv.appendChild(textDiv);
        
        const imagesGrid = document.createElement('div');
        imagesGrid.className = 'generated-images';
        
        result.images.forEach((image, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'generated-image';
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = `Generated image ${index + 1}`;
            img.loading = 'lazy';
            
            // Add image actions
            const imageActions = document.createElement('div');
            imageActions.className = 'image-actions';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'copy-image-btn';
            downloadBtn.textContent = '📥 下载';
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadImage(image.url);
            });

            const editBtn = document.createElement('button');
            editBtn.className = 'edit-image-btn';
            editBtn.textContent = '✏️ 修改';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectImageForEdit(image.url);
            });
            
            imageActions.appendChild(downloadBtn);
            imageActions.appendChild(editBtn);
            
            // Add click to view full size
            img.addEventListener('click', () => {
                this.showImageFullSize(image.url);
            });
            
            imageContainer.appendChild(img);
            imageContainer.appendChild(imageActions);
            imagesGrid.appendChild(imageContainer);
        });
        
        messageDiv.appendChild(imagesGrid);
        messagesContainer.appendChild(messageDiv);
        
        if (shouldScroll) {
            this.scrollToBottom();
        }
        
        this.updateBackButton();
    }

    showImageFullSize(imageUrl) {
        // Create a modal to show full-size image
        const modal = document.createElement('div');
        modal.className = 'modal image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.9);
            cursor: pointer;
            z-index: 2000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            max-width: 95%;
            max-height: 95%;
            text-align: center;
            position: relative;
            cursor: default;
        `;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 100%; 
            max-height: 95vh; 
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            cursor: pointer;
        `;
        
        modalContent.appendChild(img);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        // 点击背景或图片都可以关闭
        modal.addEventListener('click', (e) => {
            // 如果点击的是图片或者背景，都关闭
            closeModal();
        });
        
        // 阻止modalContent的点击事件冒泡（但允许图片点击）
        modalContent.addEventListener('click', (e) => {
            // 如果点击的是图片，关闭模态框
            if (e.target === img) {
                closeModal();
            }
        });
        
        // ESC 键关闭
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // 根据类型设置图标
        let icon = '';
        switch (type) {
            case 'success':
                icon = '✅';
                break;
            case 'warning':
                icon = '⚠️';
                break;
            case 'error':
                icon = '❌';
                break;
            default:
                icon = 'ℹ️';
        }
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);
        
        // 自动移除（5秒后）
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    autoSelectLatestImage(imageUrl) {
        // 设置最新生成的图片为选中状态
        this.selectedImageUrl = imageUrl;
        console.log('Auto-selected latest image for editing:', imageUrl);
        
        // 自动切换到图片编辑模型
        const modelSelect = document.getElementById('model-select');
        const currentModel = modelSelect.value;
        
        // 如果当前不是编辑模型，则切换到编辑模型
        if (!this.supportedModels[currentModel] || this.supportedModels[currentModel].type !== 'image-to-image') {
            modelSelect.value = 'nano-banana-edit';
            this.handleModelChange('nano-banana-edit');
            console.log('Auto-switched to edit model: nano-banana-edit');
        }
        
        // 显示图片预览
        this.showImagePreview(imageUrl);
        
        // 显示通知
        this.showNotification('最新生成的图片已自动选中，可直接输入编辑指令', 'info');
    }

    async downloadImage(imageUrl) {
        try {
            // 下载图片到本地
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // 创建下载链接
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `generated-image-${Date.now()}.png`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 清理 URL 对象
            URL.revokeObjectURL(url);
            
            this.showNotification('图片已下载', 'success');
            
        } catch (error) {
            console.error('Download failed:', error);
            
            // 备用方案 - 在新窗口打开图片
            try {
                window.open(imageUrl, '_blank');
                this.showNotification('已在新窗口打开图片，请右键保存', 'info');
            } catch (fallbackError) {
                this.showNotification('下载失败，请手动保存图片', 'error');
            }
        }
    }

    selectImageForEdit(imageUrl) {
        // 选中图片用于编辑
        this.selectedImageUrl = imageUrl;
        console.log('Selected image for editing:', imageUrl);
        
        // 自动切换到图片编辑模型（默认使用 nano-banana-edit）
        const modelSelect = document.getElementById('model-select');
        modelSelect.value = 'nano-banana-edit';
        
        // 触发模型变更事件
        this.handleModelChange('nano-banana-edit');
        
        // 显示选中的图片预览
        this.showImagePreview(imageUrl);
        
        // 提示用户
        this.showNotification('图片已选中用于编辑，现在可以输入修改指令', 'success');
        
        // 聚焦到输入框
        document.getElementById('prompt-input').focus();
    }

    showSessionsModal() {
        const modal = document.getElementById('sessions-modal');
        const sessionsList = document.getElementById('sessions-list');
        
        if (this.sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="empty-sessions">
                    <div class="empty-sessions-icon">📝</div>
                    <p>暂无历史会话</p>
                    <p>开始新的对话来创建会话记录</p>
                </div>
            `;
        } else {
            sessionsList.innerHTML = '';
            this.sessions.forEach(session => {
                const sessionItem = document.createElement('div');
                sessionItem.className = 'session-item';
                if (session.id === this.currentSessionId) {
                    sessionItem.classList.add('active');
                }
                
                const preview = session.messages.length > 0 
                    ? session.messages[0].content.substring(0, 100) + '...'
                    : '空会话';
                
                sessionItem.innerHTML = `
                    <div class="session-title">${session.title}</div>
                    <div class="session-preview">${preview}</div>
                    <div class="session-meta">
                        <span class="session-date">${new Date(session.createdAt).toLocaleDateString()}</span>
                        <span class="session-count">${session.messages.length} 条消息</span>
                    </div>
                `;
                
                sessionItem.addEventListener('click', () => {
                    this.loadSession(session.id);
                    this.hideSessionsModal();
                });
                
                sessionsList.appendChild(sessionItem);
            });
        }
        
        modal.style.display = 'block';
    }

    hideSessionsModal() {
        document.getElementById('sessions-modal').style.display = 'none';
    }

    clearAllSessions() {
        if (confirm('确定要清空所有历史会话吗？此操作不可撤销。')) {
            this.sessions = [];
            this.saveSessions();
            this.hideSessionsModal();
            this.createNewSession();
        }
    }

    showModelInfoModal() {
        const modal = document.getElementById('model-info-modal');
        const content = document.getElementById('model-info-content');
        const selectedModel = document.getElementById('model-select').value;
        const modelInfo = this.supportedModels[selectedModel];
        
        if (modelInfo) {
            content.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <h3 style="color: #1f2937; margin-bottom: 0.5rem;">${modelInfo.name}</h3>
                    <p style="color: #6b7280; margin-bottom: 1rem;">${modelInfo.description}</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #374151; margin-bottom: 0.5rem;">特性：</h4>
                    <ul style="color: #6b7280; padding-left: 1.5rem;">
                        ${modelInfo.features.map(feature => `<li style="margin-bottom: 0.25rem;">${feature}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; font-size: 0.9rem; color: #6b7280;">
                    <strong>提示：</strong> 不同模型有不同的特点和成本，请根据需要选择合适的模型。
                </div>
            `;
        }
        
        modal.style.display = 'block';
    }

    hideModelInfoModal() {
        document.getElementById('model-info-modal').style.display = 'none';
    }

    handleGlobalShortcuts(e) {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
        
        // Escape key - close any open modal
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
            return;
        }

        // Only handle shortcuts with Ctrl/Cmd
        if (!ctrlKey) return;

        switch (e.key.toLowerCase()) {
            case 'enter':
                // Ctrl/Cmd + Enter - Generate image (only if not in modal and not already generating)
                if (!this.isAnyModalOpen() && !this.isGenerating) {
                    e.preventDefault();
                    this.generateImage();
                }
                break;
                
            case 'n':
                // Ctrl/Cmd + N - New session
                e.preventDefault();
                this.createNewSession();
                break;
                
            case 'h':
                // Ctrl/Cmd + H - Show history
                e.preventDefault();
                this.showSessionsModal();
                break;
                
            case ',':
                // Ctrl/Cmd + , - Settings
                e.preventDefault();
                this.showSettingsModal();
                break;
                
            case 'p':
                // Ctrl/Cmd + P - Parameters
                e.preventDefault();
                this.showParametersModal();
                break;
                
            case 'i':
                // Ctrl/Cmd + I - Model info
                e.preventDefault();
                this.showModelInfoModal();
                break;
                
            case 'b':
                // Ctrl/Cmd + B - Back to welcome
                e.preventDefault();
                this.showWelcomeMessage();
                break;
        }
    }

    isAnyModalOpen() {
        const modals = document.querySelectorAll('.modal');
        return Array.from(modals).some(modal => modal.style.display === 'block');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        // 使用 requestAnimationFrame 确保在 DOM 更新后执行滚动
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
    }

    handleModelChange(modelKey) {
        const modelConfig = this.supportedModels[modelKey];
        if (!modelConfig) return;

        const imageUploadSection = document.getElementById('image-upload-section');
        
        if (modelConfig.type === 'image-to-image') {
            // 显示图片上传区域
            imageUploadSection.style.display = 'block';
        } else {
            // 隐藏图片上传区域，并清除选中的图片
            imageUploadSection.style.display = 'none';
            this.removeSelectedImage();
        }
    }

    handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            this.addMessage('system', '请选择有效的图片文件');
            return;
        }

        // 检查文件大小（限制为10MB）
        if (file.size > 10 * 1024 * 1024) {
            this.addMessage('system', '图片文件过大，请选择小于10MB的图片');
            return;
        }

        this.selectedImageFile = file;
        
        // 创建预览
        const reader = new FileReader();
        reader.onload = (e) => {
            this.selectedImageUrl = e.target.result;
            this.showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageUrl) {
        const previewContainer = document.getElementById('selected-image-preview');
        const previewImg = document.getElementById('preview-img');
        const uploadLabel = document.querySelector('.image-upload-label');
        
        previewImg.src = imageUrl;
        previewContainer.style.display = 'block';
        uploadLabel.style.display = 'none';
        
        // 添加编辑状态标识
        let editLabel = previewContainer.querySelector('.edit-mode-label');
        if (!editLabel) {
            editLabel = document.createElement('div');
            editLabel.className = 'edit-mode-label';
            editLabel.textContent = '✏️ 编辑模式';
            previewContainer.appendChild(editLabel);
        }
        
        // 如果没有显示系统消息，则显示提示
        if (!this.addMessage) {
            console.log('图片已选择，现在可以输入编辑指令');
        }
    }

    removeSelectedImage() {
        const previewContainer = document.getElementById('selected-image-preview');
        const uploadLabel = document.querySelector('.image-upload-label');
        const imageInput = document.getElementById('image-input');
        
        // 移除编辑模式标签
        const editLabel = previewContainer.querySelector('.edit-mode-label');
        if (editLabel) {
            editLabel.remove();
        }
        
        previewContainer.style.display = 'none';
        uploadLabel.style.display = 'flex';
        imageInput.value = '';
        
        this.selectedImageUrl = null;
        this.selectedImageFile = null;
    }

    async uploadImageToCloudinary(file) {
        // 这里使用一个简单的方法将图片转换为base64 URL
        // 在实际应用中，您可能需要上传到云存储服务
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    initResizer() {
        const resizer = document.getElementById('resizer');
        const chatContainer = document.querySelector('.chat-container');
        const inputContainer = document.querySelector('.input-container');
        const mainContent = document.querySelector('.main-content');
        
        let isResizing = false;
        let startY = 0;
        let startChatHeight = 0;
        let startInputHeight = 0;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            
            // 获取当前高度
            const chatRect = chatContainer.getBoundingClientRect();
            const inputRect = inputContainer.getBoundingClientRect();
            startChatHeight = chatRect.height;
            startInputHeight = inputRect.height;
            
            // 添加拖拽样式
            resizer.classList.add('dragging');
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const mainRect = mainContent.getBoundingClientRect();
            const totalHeight = mainRect.height - 22; // 减去分隔线高度
            
            // 计算新的高度
            let newChatHeight = startChatHeight + deltaY;
            let newInputHeight = startInputHeight - deltaY;
            
            // 限制最小和最大高度
            const minChatHeight = 200;
            const minInputHeight = 150;
            const maxInputHeight = 400;
            
            if (newChatHeight < minChatHeight) {
                newChatHeight = minChatHeight;
                newInputHeight = totalHeight - newChatHeight;
            } else if (newInputHeight < minInputHeight) {
                newInputHeight = minInputHeight;
                newChatHeight = totalHeight - newInputHeight;
            } else if (newInputHeight > maxInputHeight) {
                newInputHeight = maxInputHeight;
                newChatHeight = totalHeight - newInputHeight;
            }
            
            // 应用新的高度
            chatContainer.style.height = `${newChatHeight}px`;
            chatContainer.style.flex = 'none';
            inputContainer.style.height = `${newInputHeight}px`;
            inputContainer.style.flex = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            
            isResizing = false;
            resizer.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
        
        // 双击重置布局
        resizer.addEventListener('dblclick', () => {
            chatContainer.style.height = '';
            chatContainer.style.flex = '1';
            inputContainer.style.height = '';
            inputContainer.style.flex = 'none';
            
            this.showNotification('布局已重置', 'info');
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageGeneratorApp();
});
