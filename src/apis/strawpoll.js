import fetch from 'node-fetch'
import {ExistenceError, APIError} from '../util/errors';

const endpoint = 'https://www.strawpoll.me/api/v2/polls';
const dupcheckOptions = ['normal', 'permissive', 'disabled'];

export default class StrawPoll {
  constructor ({title, options, multi, dupcheck, captcha, id, votes}) {
    this.title = title || 'no title';
    this.options = options || {};
    this.multi = multi || false;
    this.dupcheck = dupcheck || 'normal';
    this.captcha = captcha || false;
    this.id = id;
    this.votes = votes || [];
  }

  edit (changes) {
    this.title = changes.title || this.title;
    this.options = changes.options || this.options;
    this.multi = changes.multi || this.multi;
    this.dupcheck = changes.dupcheck || this.dupcheck;
    this.captcha = changes.captcha || this.captcha;
    this.id = changes.id || this.id;
    this.votes = changes.votes || this.votes;

    if (!dupcheckOptions.includes(this.dupcheck)) {
      this.dupcheck = 'normal';
    }
  }

  async create () {
    if (!this.title) throw ExistenceError('Must have a title to create poll');

    if (Object.keys(this.options).length === 0) throw ExistenceError('Must have options to create poll');

    if (this.id) throw ExistenceError('Poll already exists');

    const payload = {
      title: this.title,
      options: this.options,
      multi: this.multi,
      dupcheck: this.dupcheck,
      captcha: this.captcha,
    };

    const resp = await fetch(endpoint, {
      method: 'post',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    if (resp.ok) {
      const data = await resp.json();

      this.id = data.id;
      return true;
    }
    return false;
  }

  async get () {
    if (!self.id) throw ExistenceError('Poll does not exist');

    const resp = await fetch(`${endpoint}/${this.id}`);
    if (resp.ok) {
      const data = await resp.json();
      this.edit(data);
      return data;
    } else throw APIError('Strawpoll get request failed');
  }
}