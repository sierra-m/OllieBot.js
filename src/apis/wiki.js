// @flow
import wiki from 'wikijs'
import {ResolvedPage} from '../typedefs/resolved-page'


const getPage = async (query: String): ResolvedPage => {
  const foundNames = await wiki().search(query, 1);
  if (foundNames && foundNames.results.length) {
    const title = foundNames.results[0];
    const page = await wiki().page(title);

    let images = await page.images();
    images = await images.filter(url => url.endsWith('jpg') || url.endsWith('png'));

    const preferredImage = images.filter(url => url.includes(title.replace(' ', '_')));
    let image = null;
    if (preferredImage.length) image = preferredImage[0];
    else image = images[0];

    let summary = await page.summary();
    summary = await summary.match(/.+(?=\n|$)/)[0];
    if (summary.length > 500) {
      const end = summary.substring(0, 500).lastIndexOf('. ');
      summary = summary.substring(0, end+1);
    }
    return {
      image: image,
      title: title,
      url: page.url(),
      summary: summary
    }
  }
};

export default {getPage}