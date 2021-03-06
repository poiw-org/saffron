import MongoClient from "mongodb";
import Logger from "../../../middleware/logger";
import {LoggerTypes} from "../../../middleware/LoggerTypes"
import Article from "../../../components/articles";
import Database from "../database";
import Config from "../../../components/config"
import Worker from "../../workers/index";

export default class MongoDB extends Database {

    declare client: MongoClient.MongoClient

    async connect(): Promise<boolean> {
        try {
            this.client = await MongoClient.connect(Config.load()!!.database.config.url, {
                "useUnifiedTopology": true,
                "useNewUrlParser": true
            })
            return true
        } catch (e) {
            Logger(LoggerTypes.INSTALL_ERROR, `Database error: ${e.message}.`)
        }

        return false
    }

    async onConnectionLost(callback: () => void): Promise<void> {
        this.client.on('close', callback)
    }

    async deleteArticle(id: string): Promise<void> {
        try {
            await this.client.db(Config.load()!!.database.config.name).collection('articles').deleteOne({id})
        } catch (e) {
            Logger(LoggerTypes.ERROR, `Database error: ${e.message}.`)
        }
    }

    async getArticle(id: string): Promise<Article | undefined> {
        try {
            return await this.client.db(Config.load()!!.database.config.name).collection('articles').findOne({id})
        } catch (e) {
            Logger(LoggerTypes.ERROR, `Database error: ${e.message}.`)
        }
        return undefined
    }

    async getArticles(options: object | null = null): Promise<Array<Article>> {
        try {
            let _articles = await this.client.db(Config.load()!!.database.config.name).collection('articles').find().toArray()
            let articles: Article[]
            return _articles.map((_article: Article)=>{
                let article = new Article()

                for(let key in _article)
                    { // @ts-ignore
                        article[key] = _article[key]
                    }
                return article

            })
        } catch (e) {
            Logger(LoggerTypes.ERROR, `Database error: ${e.message}.`)
        }
        return []
    }

    async pushArticle(article: Article): Promise<string> {
        try {
            await this.client.db(Config.load()!!.database.config.name).collection('articles').insertOne(await article.toJSON())
            return article.id
        }
        catch (e) {
            Logger(LoggerTypes.ERROR, `Database error: ${e.message}.`)
        }
        return ""
    }

    async updateArticle(article: Article): Promise<void> {
        try {
            await this.client.db(Config.load()!!.database.config.name).collection('articles').updateOne({ id: article.id }, await article.toJSON())
        }
        catch (e) {
            Logger(LoggerTypes.ERROR, `Database error: ${e.message}.`)
        }
    }
}