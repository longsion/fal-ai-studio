class ImageGeneratorApp {
    constructor() {
        this.currentParameters = {
            imageSize: 'landscape_4_3',
            steps: 4,
            numImages: 1,
            safetyChecker: true
        };
        
        this.conversationHistory = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadSettings();
        this.updateParameterDisplays();
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
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateImage();
        });

        // Enter key in prompt input
        document.getElementById('prompt-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.generateImage();
            }
        });

        // Parameter range inputs
        document.getElementById('steps').addEventListener('input', (e) => {
            document.getElementById('steps-value').textContent = e.target.value;
        });

        document.getElementById('num-images').addEventListener('input', (e) => {
            document.getElementById('num-images-value').textContent = e.target.value;
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

    async generateImage() {
        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) {
            this.addMessage('system', '请输入图像描述');
            return;
        }

        const model = document.getElementById('model-select').value;
        const apiKey = await window.electronAPI.getConfig('falApiKey');
        
        if (!apiKey) {
            this.addMessage('system', '请先在设置中配置 API Key');
            this.showSettingsModal();
            return;
        }

        // Add user message to chat
        this.addMessage('user', prompt);
        
        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: prompt,
            timestamp: new Date()
        });

        // Clear input
        document.getElementById('prompt-input').value = '';

        // Show loading
        this.showLoading();
        
        // Disable generate button
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';

        try {
            const result = await window.electronAPI.generateImage({
                model: model,
                prompt: prompt,
                apiKey: apiKey,
                parameters: this.currentParameters
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
            } else {
                this.addMessage('system', '图像生成失败: ' + (result.error || '未知错误'));
            }
        } catch (error) {
            this.hideLoading();
            console.error('Generation error:', error);
            this.addMessage('system', '图像生成失败: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '生成图像';
        }
    }

    addMessage(type, content) {
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
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addGeneratedImages(result) {
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
            
            // Add click to view full size
            img.addEventListener('click', () => {
                this.showImageFullSize(image.url);
            });
            
            imageContainer.appendChild(img);
            imagesGrid.appendChild(imageContainer);
        });
        
        messageDiv.appendChild(imagesGrid);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showImageFullSize(imageUrl) {
        // Create a modal to show full-size image
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            margin: 2% auto;
            padding: 1rem;
            border-radius: 8px;
            max-width: 90%;
            max-height: 90%;
            overflow: auto;
            text-align: center;
        `;
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = 'max-width: 100%; max-height: 80vh; border-radius: 4px;';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.style.cssText = `
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        modalContent.appendChild(img);
        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageGeneratorApp();
});
