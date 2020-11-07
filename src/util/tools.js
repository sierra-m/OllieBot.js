const sleep = ms => new Promise(res => setTimeout(res, ms));

const bind = (num, low, high) => Math.min(Math.max(num, low), high);

const getSafe = (thing, def) => {
  if (thing === undefined) return def;
  return thing;
};

const truncate = (str, n) => {
  return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
};

const orderedNumerics = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];

export {sleep, bind, getSafe, orderedNumerics, truncate}