import { ImageGenerator, ImageGeneratorType, ImageGeneratorTypeMap } from "../interfaces/image-gen.interface";
import { TextLogoGenerator } from "./text-logo";
import { PDD920LogoGenerator } from "./pdd920-logo";
import { AliWanX21ImageGenerator } from "./aliwanx2.1.image";

/**
 * 图片生成器工厂类
 */
export class ImageGeneratorFactory {
    private static instance: ImageGeneratorFactory;
    private generators: Map<ImageGeneratorType, ImageGenerator> = new Map();

    private constructor() { }

    /**
     * 获取工厂实例
     */
    public static getInstance(): ImageGeneratorFactory {
        if (!ImageGeneratorFactory.instance) {
            ImageGeneratorFactory.instance = new ImageGeneratorFactory();
        }
        return ImageGeneratorFactory.instance;
    }

    /**
     * 获取指定类型的图片生成器
     * @param type 生成器类型
     * @param needRefresh 是否需要刷新配置
     * @returns 图片生成器实例
     */
    public async getGenerator<T extends ImageGeneratorType>(
        type: T,
        needRefresh: boolean = true
    ): Promise<ImageGeneratorTypeMap[T]> {
        // 如果已经创建过该类型的生成器，且不需要刷新，直接返回
        if (this.generators.has(type) && !needRefresh) {
            return this.generators.get(type)! as ImageGeneratorTypeMap[T];
        }

        // 如果需要刷新且生成器存在，先刷新配置
        if (needRefresh && this.generators.has(type)) {
            await this.generators.get(type)!.refresh();
            return this.generators.get(type)! as ImageGeneratorTypeMap[T];
        }

        // 创建新的生成器实例
        let generator: ImageGenerator;

        switch (type) {
            case "TEXT_LOGO":
                generator = new TextLogoGenerator();
                break;
            case "PDD920_LOGO":
                generator = new PDD920LogoGenerator();
                break;
            case "ALIWANX21":
                generator = new AliWanX21ImageGenerator();
                break;
            default:
                throw new Error(`不支持的图片生成器类型: ${type}`);
        }

        // 初始化生成器
        await generator.initialize();
        this.generators.set(type, generator);
        return generator as ImageGeneratorTypeMap[T];
    }

    /**
     * 刷新所有生成器的配置
     */
    public async refreshAllGenerators(): Promise<void> {
        const refreshPromises: Promise<void>[] = [];

        for (const [type, generator] of this.generators.entries()) {
            refreshPromises.push(
                generator.refresh().catch(error => {
                    console.error(`刷新图片生成器配置失败 [${type}]:`, error);
                })
            );
        }

        await Promise.allSettled(refreshPromises);
    }
} 