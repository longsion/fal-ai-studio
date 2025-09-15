const axios = require('axios');

class ImageGenerator {
  constructor() {
    this.supportedModels = {
      'fal-nano-banana': {
        name: 'Fal.ai Nano Banana (默认)',
        endpoint: 'https://fal.run/fal-ai/flux/schnell',
        provider: 'fal',
        description: '快速生成，适合快速预览'
      },
      'flux-pro-ultra': {
        name: 'FLUX1.1 [pro] ultra',
        endpoint: 'https://fal.run/fal-ai/flux-pro/v1.1-ultra',
        provider: 'fal',
        description: '专业级图像质量，支持2K分辨率'
      },
      'flux-dev': {
        name: 'FLUX.1 [dev]',
        endpoint: 'https://fal.run/fal-ai/flux/dev',
        provider: 'fal',
        description: '12B参数模型，高质量图像生成'
      },
      'recraft-v3': {
        name: 'Recraft V3',
        endpoint: 'https://fal.run/fal-ai/recraft-v3/text-to-image',
        provider: 'fal',
        description: '支持长文本、矢量艺术和品牌风格'
      },
      'ideogram-v2': {
        name: 'Ideogram V2',
        endpoint: 'https://fal.run/fal-ai/ideogram-v2/text-to-image',
        provider: 'fal',
        description: '优秀的排版处理和现实感输出'
      },
      'stable-diffusion-35': {
        name: 'Stable Diffusion 3.5 Large',
        endpoint: 'https://fal.run/fal-ai/stable-diffusion-v3-5-large/text-to-image',
        provider: 'fal',
        description: '改进的图像质量和复杂提示理解'
      }
    };
  }

  async generateImage(options) {
    const { model, prompt, apiKey, parameters = {} } = options;
    
    if (!this.supportedModels[model]) {
      throw new Error(`Unsupported model: ${model}`);
    }

    const modelConfig = this.supportedModels[model];
    
    switch (modelConfig.provider) {
      case 'fal':
        return await this.generateWithFal(modelConfig, prompt, apiKey, parameters);
      default:
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
    }
  }

  async generateWithFal(modelConfig, prompt, apiKey, parameters) {
    if (!apiKey) {
      throw new Error('Fal.ai API key is required');
    }

    try {
      const requestData = {
        prompt: prompt,
        image_size: parameters.imageSize || "landscape_4_3",
        num_inference_steps: parameters.steps || 4,
        num_images: parameters.numImages || 1,
        enable_safety_checker: parameters.safetyChecker !== false
      };

      console.log('Sending request to Fal.ai:', requestData);

      const response = await axios.post(modelConfig.endpoint, requestData, {
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      });

      if (response.data && response.data.images && response.data.images.length > 0) {
        return {
          success: true,
          images: response.data.images.map(img => ({
            url: img.url,
            width: img.width || null,
            height: img.height || null
          })),
          prompt: prompt,
          model: modelConfig.name,
          parameters: parameters
        };
      } else {
        throw new Error('No images returned from API');
      }
    } catch (error) {
      console.error('Fal.ai API error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data?.detail || error.response.data?.message || 'API request failed';
        throw new Error(`Fal.ai API error: ${errorMsg}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to connect to Fal.ai API');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  getSupportedModels() {
    return this.supportedModels;
  }
}

const imageGenerator = new ImageGenerator();

module.exports = {
  generateImage: (options) => imageGenerator.generateImage(options),
  getSupportedModels: () => imageGenerator.getSupportedModels()
};
