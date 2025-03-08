/**
 * 图片生成器接口
 */
export interface ImageGenerator {
    /**
     * 初始化生成器
     */
    initialize(): Promise<void>;

    /**
     * 刷新配置
     */
    refresh(): Promise<void>;

    /**
     * 生成图片
     * @param options 生成选项
     * @returns 生成结果（可能是Buffer或URL）
     */
    generate(options: any): Promise<Buffer | string>;

    /**
     * 将生成的图片保存到文件
     * @param options 生成选项
     * @param outputPath 输出路径
     */
    saveToFile(options: any, outputPath: string): Promise<void>;
}

/**
 * 图片生成器类型
 */
export type ImageGeneratorType = "TEXT_LOGO" | "PDD920_LOGO" | "ALIWANX21";

/**
 * 图片生成器类型映射
 */
export interface ImageGeneratorTypeMap {
    "TEXT_LOGO": import("../image-gen/text-logo").TextLogoGenerator;
    "PDD920_LOGO": import("../image-gen/pdd920-logo").PDD920LogoGenerator;
    "ALIWANX21": import("../image-gen/aliwanx2.1.image").AliWanX21ImageGenerator;
}
