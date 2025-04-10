import { Workflow } from "./interfaces/workflow.interface.ts";
import { AliWanX21ImageGenerator } from "@src/providers/image-gen/aliyun/aliwanx2.1.image.ts";
import { HelloGithubScraper } from "@src/modules/scrapers/hellogithub.scraper.ts";
import { WeixinPublisher } from "@src/modules/publishers/weixin.publisher.ts";
import { ImageGeneratorFactory } from "@src/providers/image-gen/image-generator-factory.ts";
import { HelloGithubTemplateRenderer } from "@src/modules/render/hellogithub.renderer.ts";

export class WeixinHelloGithubWorkflow implements Workflow {
  private scraper: HelloGithubScraper;
  private publisher: WeixinPublisher;
  private imageGenerator: AliWanX21ImageGenerator;
  private renderer: HelloGithubTemplateRenderer;

  constructor() {
    this.scraper = new HelloGithubScraper();
    this.publisher = new WeixinPublisher();
    this.imageGenerator = new AliWanX21ImageGenerator();
    this.renderer = new HelloGithubTemplateRenderer();
  }

  /**
   * 刷新工作流所需的资源和配置
   */
  public async refresh(): Promise<void> {
    await this.publisher.refresh();
    await this.imageGenerator.refresh();
  }

  /**
   * 执行工作流的主要处理逻辑
   */
  public async process(): Promise<void> {
    try {
      console.log("开始执行 HelloGithub 工作流...");

      // 1. 获取热门项目数据
      console.log("1. 获取热门项目数据...");
      const hotItems = await this.scraper.getHotItems(1);
      const items = await Promise.all(
        hotItems.slice(0, 20).map(async (item) => {
          console.log(`正在获取项目详情: ${item.title}`);
          return await this.scraper.getItemDetail(item.itemId);
        }),
      );

      // 2. 生成封面图片
      console.log("2. 生成封面图片...");
      const prompt =
        "GitHub AI 开源项目精选，展示代码和人工智能的融合，使用现代科技风格，蓝色和绿色为主色调";
      const imageGenerator = await ImageGeneratorFactory.getInstance()
        .getGenerator("ALIWANX21");
      const imageUrl = await imageGenerator.generate({
        prompt,
        size: "1440*768",
      });

      // 上传封面图片获取 mediaId
      console.log("3. 上传封面图片...");
      const mediaId = await this.publisher.uploadImage(imageUrl);

      // 4. 渲染内容
      console.log("4. 渲染内容...");
      const firstItem = items[0];
      const html = await this.renderer.render(items);

      // 5. 发布到微信
      console.log("5. 准备发布到微信...");
      await this.publisher.publish(
        html,
        `本期精选 GitHub 热门 AI 开源项目，第一名 ${firstItem.name} 项目备受瞩目，发现最新最酷的人工智能开源工具`,
        `本期精选 GitHub 热门 AI 开源项目，第一名 ${firstItem.name} 项目备受瞩目，发现最新最酷的人工智能开源工具`,
        mediaId,
      );

      console.log("工作流执行完成！");
    } catch (error: any) {
      console.error("工作流执行失败:", error.message);
      throw error;
    }
  }
}
