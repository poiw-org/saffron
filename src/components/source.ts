import Job from "../components/job";
import randomId from "../middleware/randomId";
import Instructions from "./instructions";
import hashCode from "../middleware/hashCode";
import {ParserType} from "../modules/workers/parsers/ParserType";
import logger from "../middleware/logger";
import {LoggerTypes} from "../middleware/LoggerTypes";
import Article from "./articles";
import {hash} from "argon2";

const fs = require('fs');

const splice = function (base: string, idx: number, rem: number, str: string): string {
    return base.slice(0, idx) + str + base.slice(Math.abs(rem));
};

export default class Source {

    /**
     * Parse and store a source file contents to an array in memory
     * @param source
     */
    static async parseFileObject(source: any): Promise<void> {
        // Check if source is valid and return an object for that source
        if (source.url.length == 0)
            return logger(LoggerTypes.INSTALL_ERROR, `Error parsing source file. Please specify a url. File: ${source.filename}`)
        // if(new RegExp('^(http|https)\://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,6}(/\S*)?$').test(url)) throw new Error('You specified an invalid url')
        //if (['api', 'portal'].includes(source.type) == false) throw new Error('A source\'s "api" value must be either "api" or "portal"')

        let ret = new Source()
        ret.name = source.name
        ret.scrapeInterval = source.scrapeInterval
        ret.retryInterval = source.retryInterval
        ret.willParse = true // Get from db

        ret.instructions = new Instructions()
        ret.instructions.source = { id: `src_${hashCode(source.name)}` }
        ret.instructions.url = source.url

        let parserType = await ParserType.getFromString(source.type)
        if(parserType === ParserType.UNKNOWN)
            return logger(LoggerTypes.INSTALL_ERROR, `Error parsing source file. Incorrect type. File: ${source.filename}`)

        ret.instructions.parserType = parserType
        switch (parserType) {
            case ParserType.HTML: {

            } break
            case ParserType.RSS: {
                if(!source.name || !source.url) return logger(LoggerTypes.INSTALL_ERROR, `Error parsing source file. Incorrect type. File: ${source.filename}`)
                if(source.renameFields) {
                    let map = new Map()
                    Object.entries(source.renameFields).forEach(([key,value])=>{
                        map.set(key,value)
                    })
                    ret.instructions.scrapeOptions = { renameFields: map }
                }
            } break
            case ParserType.CUSTOM: {
                let scrapeStr = source.scrape.toString()

                let strFunc = splice(scrapeStr
                    , scrapeStr.indexOf('(')
                    , scrapeStr.indexOf(')') + 1
                    , "(Article, utils, Exceptions)")

                ret.instructions.scrapeFunction = strFunc
            } break
        }

        this._sources.push(ret)
    }

    /**
     * Return a copy array of the sources
     */
    static getSources(): Array<Source> {
        return [...this._sources]
    }

    /**
     * Return the source class based on job, article or source id
     * @param from
     */
    static getSourceFrom(from: Job | Article | string): Source {
        if(from instanceof  Job)
            return this._sources.find((source: Source) => { return source.getId() === from.source.id })!!
        else if(from instanceof  Article)
            return this._sources.find((source: Source) => { return source.getId() === from.source.id })!!

        return this._sources.find((source: Source) => source.getId() === from)!!
    }

    private static _sources: Source[] = []

    private declare id: string
    declare name: string
    declare scrapeInterval: number
    declare retryInterval: number
    declare willParse: boolean
    declare instructions: Instructions

    constructor() { }

    /**
     * Locks the source file so it will not issue a new job until it is unlocked
     */
    lock(){
        this.willParse = false
        // TODO - Update grid/database?
    }

    /**
     * Generate and return the id of the source
     */
    getId(): string {
        if(!this.id)
            this.id = 'src_' + this.name

        return this.id
    }
}