const axios = require('axios');

class ImageGenerator {
  constructor() {
    this.supportedModels = {
      'fal-nano-banana': {
        name: 'Fal.ai Nano Banana',
        endpoint: 'https://fal.run/fal-ai/flux/schnell',
        provider: 'fal'
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
