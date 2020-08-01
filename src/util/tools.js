const sleep = ms => new Promise(res => setTimeout(res, ms));

const bind = (num, low, high) => Math.min(Math.max(num, low), high);

const getSafe = (thing, def) => {
  if (thing === undefined) return def;
  return thing;
};

const orderedNumerics = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];

export {sleep, bind, getSafe, orderedNumerics}