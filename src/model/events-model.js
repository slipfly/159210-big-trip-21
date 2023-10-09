import { UpdateType } from '../const.js';
import Observable from '../framework/observable.js';

export default class EventsModel extends Observable {
  #eventsApiService = null;
  #destinationsModel = null;
  #offersModel = null;

  #events = [];

  constructor({ eventsApiService, destinationsModel, offersModel }) {
    super();
    this.#eventsApiService = eventsApiService;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
  }

  get events() {
    return this.#events;
  }

  async init() {
    try {
      await Promise.all([
        this.#destinationsModel.init(),
        this.#offersModel.init()
      ]);

      const events = await this.#eventsApiService.events;

      this.#events = events.map(this.#adaptToClient.bind(this));
    } catch(err) {
      this.#events = [];
    }

    this._notify(UpdateType.INIT);
  }

  updateEvent(updateType, update) {
    const index = this.#events.findIndex((event) => event.id === update.id);

    if (index === -1) {
      throw new Error('Can\'t update unexisting event');
    }

    this.#events = [
      ...this.#events.slice(0, index),
      update,
      ...this.#events.slice(index + 1),
    ];

    this._notify(updateType, update);
  }

  addEvent(updateType, update) {
    this.#events = [
      update,
      ...this.#events,
    ];

    this._notify(updateType, update);
  }

  deleteEvent(updateType, update) {
    const index = this.#events.findIndex((event) => event.id === update.id);

    if (index === -1) {
      throw new Error('Can\'t delete unexisting event');
    }

    this.#events = [
      ...this.#events.slice(0, index),
      ...this.#events.slice(index + 1),
    ];

    this._notify(updateType, update);
  }

  #adaptToClient(event) {
    //вот здесь я хочу сразу заменить destination id и офферы на человеческие данные,
    //но при вызове this._destinations вся функция adaptToClient перестаёт работать

    const humanizeOffers = (offer) => this.#offersModel
      .getByType(event.type).offers
      .find((item) => item.id === offer);

    const adaptedEvent = {...event,
      basePrice: event['base_price'],
      dateFrom: event['date_from'] !== null ? new Date(event['date_from']) : event['date_from'],
      dateTo: event['date_to'] !== null ? new Date(event['date_to']) : event['date_to'],
      isFavorite: event['is_favorite'],
      destination: this.#destinationsModel.getById(event.destination).name,
      offers: event.offers.map(humanizeOffers),
    };

    delete adaptedEvent['base_price'];
    delete adaptedEvent['date_from'];
    delete adaptedEvent['date_to'];
    delete adaptedEvent['is_favorite'];

    return adaptedEvent;
  }
}
