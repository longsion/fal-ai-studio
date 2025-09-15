const { fal } = require('@fal-ai/client');

class ImageGenerator {
  constructor() {
    this.supportedModels = {
      'fal-nano-banana': {
        name: 'Fal.ai Nano Banana (默认)',
        modelId: 'fal-ai/nano-banana',
        provider: 'fal',
        description: '快速生成，适合快速预览',
        supportedParams: ['prompt', 'guidance_scale', 'num_images', 'safety_tolerance', 'output_format', 'aspect_ratio']
      },
      'flux-schnell': {
        name: 'FLUX.1 [schnell]',
        modelId: 'fal-ai/flux/schnell',
        provider: 'fal',
        description: '快速生成模型，速度优先'
      },
      'flux-dev': {
        name: 'FLUX.1 [dev]',
        modelId: 'fal-ai/flux/dev',
        provider: 'fal',
        description: '12B参数模型，高质量图像生成'
      },
      'flux-pro-ultra': {
        name: 'FLUX1.1 [pro] ultra',
        modelId: 'fal-ai/flux-pro/v1.1-ultra',
        provider: 'fal',
        description: '专业级图像质量，支持2K分辨率'
      },
      'recraft-v3': {
        name: 'Recraft V3',
        modelId: 'fal-ai/recraft-v3/text-to-image',
        provider: 'fal',
        description: '支持长文本、矢量艺术和品牌风格'
      },
      'ideogram-v2': {
        name: 'Ideogram V2',
        modelId: 'fal-ai/ideogram-v2/text-to-image',
        provider: 'fal',
        description: '优秀的排版处理和现实感输出'
      },
      'stable-diffusion-35': {
        name: 'Stable Diffusion 3.5 Large',
        modelId: 'fal-ai/stable-diffusion-v35-large/text-to-image',
        provider: 'fal',
        description: '改进的图像质量和复杂提示理解'
      },
      'bria-3-2': {
        name: 'Bria 3.2',
        modelId: 'fal-ai/bria/text-to-image/3.2',
        provider: 'fal',
        description: '商业安全，文本渲染优秀'
      },
      'imagen4-preview': {
        name: 'Imagen 4 Preview',
        modelId: 'fal-ai/imagen4/preview',
        provider: 'fal',
        description: 'Google最高质量图像生成模型'
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
      // 配置 Fal.ai 客户端
      fal.config({
        credentials: apiKey
      });

      // 根据模型类型构建输入参数
      let input = {
        prompt: prompt
      };

      // 针对不同模型使用不同的参数映射
      if (modelConfig.modelId === 'fal-ai/nano-banana') {
        // nano-banana 特殊参数
        input = {
          prompt: prompt,
          guidance_scale: parameters.guidanceScale || 3.5,
          num_images: parameters.numImages || 1,
          safety_tolerance: parameters.safetyTolerance || "2",
          output_format: "jpeg",
          aspect_ratio: this.mapImageSizeToAspectRatio(parameters.imageSize)
        };
      } else {
        // 其他模型的通用参数
        input = {
          prompt: prompt,
          image_size: parameters.imageSize || "landscape_4_3",
          num_inference_steps: parameters.steps || 4,
          num_images: parameters.numImages || 1,
          enable_safety_checker: parameters.safetyChecker !== false
        };
      }

      console.log('Sending request to Fal.ai:', {
        model: modelConfig.modelId,
        input: input
      });

      // 使用官方客户端调用
      const result = await fal.subscribe(modelConfig.modelId, {
        input: input
      });

      console.log('Fal.ai response:', result);

      // 检查不同可能的响应结构
      let images = null;
      if (result && result.data && result.data.images && result.data.images.length > 0) {
        images = result.data.images;
      } else if (result && result.images && result.images.length > 0) {
        images = result.images;
      }
      
      if (images && images.length > 0) {
        return {
          success: true,
          images: images.map(img => ({
            url: img.url,
            width: img.width || null,
            height: img.height || null
          })),
          prompt: prompt,
          model: modelConfig.name,
          parameters: parameters
        };
      } else {
        console.log('Full API response:', JSON.stringify(result, null, 2));
        throw new Error('No images returned from API');
      }
    } catch (error) {
      console.error('Fal.ai API error:', error);
      
      if (error.body) {
        const errorMsg = error.body?.detail || error.body?.message || 'API request failed';
        throw new Error(`Fal.ai API error: ${errorMsg}`);
      } else {
        throw new Error(`Fal.ai error: ${error.message}`);
      }
    }
  }

  // 映射图像尺寸到宽高比（用于 nano-banana 模型）
  mapImageSizeToAspectRatio(imageSize) {
    const mapping = {
      'square_hd': '1:1',
      'square': '1:1',
      'portrait_4_3': '3:4',
      'portrait_16_9': '9:16',
      'landscape_4_3': '4:3',
      'landscape_16_9': '16:9'
    };
    return mapping[imageSize] || '4:3';
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
