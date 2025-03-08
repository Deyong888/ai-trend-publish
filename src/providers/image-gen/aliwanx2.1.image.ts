import axios from "axios";
import { BaseImageGenerator } from "./base.image-generator";

interface ApiResponse {
  output: {
    task_status: "PENDING" | "SUCCEEDED" | "FAILED";
    task_id: string;
    results?: Array<{
      url: string;
    }>;
  };
}

export interface AliWanX21Options {
  prompt: string;
  size?: string;
}

export class AliWanX21ImageGenerator extends BaseImageGenerator {
  private apiKey!: string;
  private baseUrl =
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
  private readonly model = "wanx2.1-t2i-turbo";

  async refresh(): Promise<void> {
    const apiKey = await this.configManager.get<string>("DASHSCOPE_API_KEY");
    if (!apiKey) {
      throw new Error("DASHSCOPE_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  /**
   * 生成图片
   * @param options 生成选项
   * @returns 图片URL数组
   */
  async generate(options: AliWanX21Options): Promise<string> {
    const { prompt, size = "1024*1024" } = options;
    try {
      const response = await axios.post<ApiResponse>(
        this.baseUrl,
        {
          model: this.model,
          input: { prompt },
          parameters: {
            size,
            seed: Math.floor(Math.random() * 4294967290) + 1,
          },
        },
        {
          headers: {
            "X-DashScope-Async": "enable",
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const taskId = response.data.output.task_id;
      return this.waitForCompletion(taskId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `图片生成失败: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  private async checkTaskStatus(taskId: string): Promise<ApiResponse['output']> {
    try {
      const response = await axios.get<ApiResponse>(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.output;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `任务状态检查失败: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  private async waitForCompletion(
    taskId: string,
    maxAttempts: number = 30,
    interval: number = 2000
  ): Promise<string> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.checkTaskStatus(taskId);

      if (status.task_status === "SUCCEEDED") {
        return status.results![0].url;
      }

      if (status.task_status === "FAILED") {
        throw new Error("图片生成任务失败");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    }

    throw new Error("等待图片生成超时");
  }
}

// Example usage:
// const generator = new AliWanX21ImageGenerator();
// const response = await generator.generateImage('一间有着精致窗户的花店，漂亮的木质门，摆放着花朵');
// const result = await generator.waitForCompletion(response.output.task_id);
