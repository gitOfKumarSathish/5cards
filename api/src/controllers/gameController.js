import { addPointsToGameService, createGameService, initializeUsersInGame, getGameService } from '../services/game.service.js';

class GameController {
    constructor() {
        this.createGame = this.createGame.bind(this);
        this.initializeUsers = this.initializeUsers.bind(this);
        this.addPointsToGame = this.addPointsToGame.bind(this);
    }

    async createGame(req, res, next) {
        return createGameService(req, res, next);
    }

    async initializeUsers(req, res, next) {
        return initializeUsersInGame(req, res, next);
    }

    async addPointsToGame(req, res, next) {
        return addPointsToGameService(req, res, next);
    }

    async getGame(req, res, next) {
        return getGameService(req, res, next);
    }
}

export default new GameController();