import Discord from 'discord.js'
import {EmbedField} from '../typedefs/embed-field'


export class InfoPage {
  constructor (embed: Discord.RichEmbed, emoji: string) {
    this.embed = embed;
    this.emoji = emoji;
  }
}

export class Pages {
  constructor (fields: Array<EmbedField>, displayLimit=10) {
    this.fields = fields;
    this.displayLimit = displayLimit;

    this.totalPages = fields.length / displayLimit;
    if (parseInt(this.totalPages) !== this.totalPages) this.totalPages += 1;
    this.totalPages = parseInt(this.totalPages);
  }

  get length () {
    return this.totalPages;
  }

  // Indexed from 1
  get (pageNum): Array<EmbedField> {
    const start = this.displayLimit * (pageNum - 1);
    const end = start + this.displayLimit;
    return this.fields.slice(start, end);
  }
}

export default class Paginator {
  constructor (pages: Pages, title: string, icon: string, color: string, inline=false) {
    this.pages = pages;
    this.title = title;
    this.icon = icon;
    this.color = color;
    this.inline = inline;

    this.infoPages = new Discord.Collection();
  }

  // indexed from 1
  render (page: number): Discord.RichEmbed {
    if (page < 1 || page > this.length) throw new Error('Page out of bounds - 1 to length');
    const em = new Discord.RichEmbed()
      .setTitle('───────────────────────')
      .setColor(this.color)
      .setAuthor(`${this.title} - ${page}/${this.length}`, this.icon);

    const fields = this.pages.get(page);
    for (let field of fields) {
      em.addField(field.name, field.value, this.inline);
    }
    return em;
  }

  renderInfo (emoji: String) {
    if (!this.infoPages.has(emoji)) throw new Error('No info page exists for that emoji!');
    return this.infoPages.get(emoji).embed;
  }

  get length () {
    return this.pages.length;
  }

  addInfoPage (embed: Discord.RichEmbed, emoji: string) {
    this.infoPages.set(emoji, new InfoPage(embed, emoji));
  }

  getInfoReactions () {
    return this.infoPages.map(x => x.emoji);
  }
}