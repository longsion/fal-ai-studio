const { fal } = require('@fal-ai/client');

class ImageGenerator {
  constructor() {
        this.supportedModels = {
          'fal-nano-banana': {
            name: 'Fal.ai Nano Banana (默认)',
            modelId: 'fal-ai/nano-banana',
            provider: 'fal',
            description: '快速生成，适合快速预览',
            type: 'text-to-image',
            supportedParams: ['prompt', 'guidance_scale', 'num_images', 'safety_tolerance', 'output_format', 'aspect_ratio']
          },
          'nano-banana-edit': {
            name: 'Nano Banana Edit (图片编辑)',
            modelId: 'fal-ai/nano-banana/edit',
            provider: 'fal',
            description: 'Google图片编辑模型，快速修改图片',
            type: 'image-to-image',
            supportedParams: ['prompt', 'image_url', 'guidance_scale', 'num_images', 'safety_tolerance', 'output_format']
          },
          'flux-schnell': {
            name: 'FLUX.1 [schnell]',
            modelId: 'fal-ai/flux/schnell',
            provider: 'fal',
            description: '快速生成模型，速度优先',
            type: 'text-to-image'
          },
          'flux-dev': {
            name: 'FLUX.1 [dev]',
            modelId: 'fal-ai/flux/dev',
            provider: 'fal',
            description: '12B参数模型，高质量图像生成',
            type: 'text-to-image'
          },
          'flux-pro-ultra': {
            name: 'FLUX1.1 [pro] ultra',
            modelId: 'fal-ai/flux-pro/v1.1-ultra',
            provider: 'fal',
            description: '专业级图像质量，支持2K分辨率',
            type: 'text-to-image'
          },
          'recraft-v3': {
            name: 'Recraft V3',
            modelId: 'fal-ai/recraft-v3/text-to-image',
            provider: 'fal',
            description: '支持长文本、矢量艺术和品牌风格',
            type: 'text-to-image'
          },
          'ideogram-v2': {
            name: 'Ideogram V2',
            modelId: 'fal-ai/ideogram-v2/text-to-image',
            provider: 'fal',
            description: '优秀的排版处理和现实感输出',
            type: 'text-to-image'
          },
          'stable-diffusion-35': {
            name: 'Stable Diffusion 3.5 Large',
            modelId: 'fal-ai/stable-diffusion-v35-large/text-to-image',
            provider: 'fal',
            description: '改进的图像质量和复杂提示理解',
            type: 'text-to-image'
          },
          'bria-3-2': {
            name: 'Bria 3.2',
            modelId: 'fal-ai/bria/text-to-image/3.2',
            provider: 'fal',
            description: '商业安全，文本渲染优秀',
            type: 'text-to-image'
          },
          'imagen4-preview': {
            name: 'Imagen 4 Preview',
            modelId: 'fal-ai/imagen4/preview',
            provider: 'fal',
            description: 'Google最高质量图像生成模型',
            type: 'text-to-image'
          },
          // 图片编辑模型
          'seedream-edit': {
            name: 'Seedream 4.0 Edit',
            modelId: 'fal-ai/bytedance/seedream/v4/edit',
            provider: 'fal',
            description: 'ByteDance最新图片编辑模型，集成生成和编辑功能',
            type: 'image-to-image'
          },
          'qwen-image-edit': {
            name: 'Qwen Image Edit',
            modelId: 'fal-ai/qwen-image-edit',
            provider: 'fal',
            description: 'Qwen图片编辑模型，优秀的文字编辑能力',
            type: 'image-to-image'
          },
          'ideogram-character-edit': {
            name: 'Ideogram Character Edit',
            modelId: 'fal-ai/ideogram/character/edit',
            provider: 'fal',
            description: '修改角色形象，保持角色一致性',
            type: 'image-to-image'
          },
          'seededit-v3': {
            name: 'SeedEdit 3.0',
            modelId: 'fal-ai/bytedance/seededit/v3/edit-image',
            provider: 'fal',
            description: 'ByteDance图片编辑模型，擅长处理真实图像',
            type: 'image-to-image'
          },
          'ideogram-v3-edit': {
            name: 'Ideogram V3 Edit',
            modelId: 'fal-ai/ideogram/v3/edit',
            provider: 'fal',
            description: 'Ideogram V3编辑功能，高保真度图像修改',
            type: 'image-to-image'
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
      if (modelConfig.type === 'image-to-image') {
        // 图片编辑模型参数
        input = {
          prompt: prompt,
          image_url: parameters.imageUrl, // 必需的图片URL
          guidance_scale: parameters.guidanceScale || 3.5,
          num_images: parameters.numImages || 1,
          safety_tolerance: parameters.safetyTolerance || "2",
          output_format: "jpeg"
        };
        
        // 为特定的编辑模型添加额外参数
        if (modelConfig.modelId === 'fal-ai/nano-banana/edit') {
          // nano-banana/edit 特殊参数
          input.aspect_ratio = this.mapImageSizeToAspectRatio(parameters.imageSize);
        }
      } else if (modelConfig.modelId === 'fal-ai/nano-banana') {
        // nano-banana 文生图特殊参数
        input = {
          prompt: prompt,
          guidance_scale: parameters.guidanceScale || 3.5,
          num_images: parameters.numImages || 1,
          safety_tolerance: parameters.safetyTolerance || "2",
          output_format: "jpeg",
          aspect_ratio: this.mapImageSizeToAspectRatio(parameters.imageSize)
        };
      } else {
        // 其他文生图模型的通用参数
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
