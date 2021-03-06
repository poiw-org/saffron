import Database from "./database"
import Config from "../../components/config"
import MongoDB from "./drivers/mongodb"
import Memory from "./drivers/memory"

export default class Driver {
    
    private static instance: Database

    /**
     * Return an instance of the database.
     */
    static getInstance(): Database | undefined {
        if(!this.instance)
            switch(Config.load()!!.database.driver){
                case "mongodb":
                    this.instance =  new MongoDB()
                    break
                case "memory":
                    this.instance = new Memory()
                    break
            }

        return this.instance
    }
}