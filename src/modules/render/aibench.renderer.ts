import path from "path";
import fs from "fs";
import { BaseTemplateRenderer } from "./base.renderer";
import { ModelPerformance } from "@src/api/livebench.api";
import { AIBenchTemplate, CategoryData, ModelScore } from "./interfaces/aibench.type";

/**
 * AI Benchmark模板渲染器
 */
export class AIBenchTemplateRenderer extends BaseTemplateRenderer<AIBenchTemplate> {
    constructor() {
        super('aibench');
        this.availableTemplates = ['default'];
    }

    /**
     * 加载AI Benchmark模板文件
     */
    protected loadTemplates(): void {
        this.templates = {
            default: fs.readFileSync(path.join(__dirname, "../../templates/aibench.ejs"), "utf-8"),
        };
    }

    /**
     * 将API返回的模型性能数据转换为AIBenchTemplate格式
     * @param modelData API返回的模型性能数据
     * @returns AIBenchTemplate格式的数据
     */
    public transformData(modelData: { [key: string]: ModelPerformance }): AIBenchTemplate {
        // 创建分类映射
        const categoryIcons: { [key: string]: string } = {
            "Reasoning": "🧠",
            "Coding": "💻",
            "Mathematics": "🔢",
            "Data Analysis": "📊",
            "Language": "🗣️",
            "IF": "🔍"
        };

        // 初始化分类数据
        const categories: CategoryData[] = Object.keys(categoryIcons).map(name => ({
            name,
            icon: categoryIcons[name],
            models: []
        }));

        // 处理所有模型数据
        const allModels: ModelScore[] = [];

        for (const [modelName, performance] of Object.entries(modelData)) {
            const metrics = performance.metrics;
            const organization = performance.organization;

            // 创建基本模型得分对象
            const modelScore: ModelScore = {
                name: modelName,
                score: metrics["Global Average"] || 0,
                reasoning: metrics["Reasoning Average"] || 0,
                coding: metrics["Coding Average"] || 0,
                math: metrics["Mathematics Average"] || 0,
                dataAnalysis: metrics["Data Analysis Average"] || 0,
                language: metrics["Language Average"] || 0,
                if: metrics["IF Average"] || 0,
                organization: organization
            };

            // 添加到全局模型列表
            allModels.push(modelScore);

            // 添加到各个分类
            categories[0].models.push({ ...modelScore, score: modelScore.reasoning || 0 });
            categories[1].models.push({ ...modelScore, score: modelScore.coding || 0 });
            categories[2].models.push({ ...modelScore, score: modelScore.math || 0 });
            categories[3].models.push({ ...modelScore, score: modelScore.dataAnalysis || 0 });
            categories[4].models.push({ ...modelScore, score: modelScore.language || 0 });
            categories[5].models.push({ ...modelScore, score: modelScore.if || 0 });
        }

        // 对全局模型按Global Average得分排序
        allModels.sort((a, b) => b.score - a.score);

        // 对各个分类的模型按该分类的得分排序
        categories.forEach(category => {
            category.models.sort((a, b) => b.score - a.score);
        });

        // 创建并返回AIBenchTemplate对象
        return {
            title: `AI模型性能评测 - ${new Date().toLocaleDateString()}`,
            updateTime: new Date().toISOString(),
            categories: categories,
            globalTop10: allModels.slice(0, 10)
        };
    }

}