import { Request, Response } from 'express';
import _ from 'lodash';
import ServiceContainer from '../services/service-container';
import Controller from './controller';
import webpush from 'web-push';

/**
 * Games controller class.
 * 
 * Root path : `/games`
 */
export default class NotificationController extends Controller {

    /**
     * Creates a new games controller.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container, '/notifications');
        this.registerEndpoint({ method: 'POST', uri: '/subscribe', handlers: this.createHandler });
        this.registerEndpoint({ method: 'GET', uri: '/send/:id', handlers: this.getHandler });
    }

    /**
     * vapidDetails
     */
    public vapidDetails() {
        webpush.setVapidDetails(process.env.WEB_PUSH_CONTACT, process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY)
    }
    /**
     * Creates a new notification.
     * 
     * Path : `POST /notifications/subscribe`
     * 
     * @param req Express request
     * @param res Express response
     * @async
     */
    public async createHandler(req: Request, res: Response){
        
    }

    public async getHandler(req: Request, res: Response): Promise<Response> {
        try {
            const subscription = req.body
            const payload = JSON.stringify({
                title: 'Shattle',
                body: 'A votre tour de jouer',
            })
            this.vapidDetails()
            await webpush.sendNotification(subscription, payload)
            return res.status(200).json({ 'success': true })
        }
        catch (error) {
            return res.status(500).send(this.container.errors.formatServerError());
        }

    }
}