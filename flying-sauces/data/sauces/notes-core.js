const n = (whyItTastes, authenticTouch) => ({ whyItTastes, authenticTouch });

export const NOTES_CORE = {
  bechamel: n(
    "The mild, milky taste is the liquid, not a spice. A white roux only cooks long enough to lose raw flour, so the sauce stays pale and sweet from milk instead of tasting toasted or meaty like a brown sauce.",
    "Add the milk warm and whisk constantly. Cold milk and a hot roux lump, and those lumps taste of raw starch."
  ),
  veloute: n(
    "It tastes of the stock you choose because stock, not milk, is the liquid. A blond roux keeps the flavor light. Chicken stock tastes of poultry. Fish stock tastes of the sea. They are not interchangeable.",
    "Simmer and skim. The long, gentle cook is what removes the raw-flour taste without browning the sauce."
  ),
  espagnole: n(
    "The dark, roasted taste comes from a brown roux and browned vegetables, then brown stock. Tomato is a seasoning here, not the main flavor, which is why it does not taste like marinara.",
    "Let the roux reach a true brown and a toasted smell before the stock goes in. A pale roux will not give you this sauce."
  ),
  "sauce-tomate": n(
    "French sauce tomate tastes cooked and savory because the tomato simmers with pork fat, stock, and a little flour. The long cook turns sharp tomato into a round sauce. That is different from a quick Italian marinara.",
    "Simmer until the raw tomato edge is gone. If it still tastes like the can, it needs more time, not more salt."
  ),
  hollandaise: n(
    "The flavor is butter, held by egg yolk and sharpened with lemon. Warmth keeps the emulsion glossy. Too much heat scrambles the yolk and the sauce tastes eggy and grainy instead of smooth.",
    "Whisk the butter in off a hard boil. If it tightens, a teaspoon of warm water brings it back. Do not try to save a scrambled yolk."
  ),
  mayonnaise: n(
    "The neutral richness is oil suspended in yolk and acid. Mustard helps the emulsion and adds a small bite. The oil you choose is the flavor: a strong olive oil tastes loud, a neutral oil tastes clean.",
    "Start the oil drop by drop. Once the sauce thickens, you can stream it. Dumping the oil in at the start is how mayonnaise breaks."
  ),
  bearnaise: n(
    "It tastes herbal and sharp because a vinegar, shallot, and tarragon reduction seasons the same butter emulsion as hollandaise. Tarragon, not lemon, is the perfume.",
    "Strain the reduction so the shallot does not stay in threads, then stir chopped tarragon leaves in at the end so they stay green."
  ),
  "beurre-blanc": n(
    "The sauce tastes of white wine and shallot because that reduction is the only liquid. Cold butter emulsifies into it if the pan stays below a boil. Boiling drives the butter out and the sauce tastes greasy.",
    "Whisk in cold butter a few cubes at a time, off a boil. A boil separates it."
  ),
  vinaigrette: n(
    "Sharpness is the vinegar, body is the oil, and mustard is what holds them together for a minute. Without mustard it separates, which is normal for a temporary emulsion. The vinegar you pick is the main flavor.",
    "Dissolve the salt in the vinegar before the oil goes in. Salt will not dissolve well in oil."
  ),
  "demi-glace": n(
    "The deep, glossy taste is reduction: water leaves, and browned stock concentrates. A little tomato and a brown roux add body. It tastes meaty because the liquid is brown stock, not because of a spice mix.",
    "Reduce until it coats a spoon. If it tastes thin, it is not done. Salt only at the end, because reduction concentrates salt."
  ),
  "pesto-alla-genovese": n(
    "Raw basil, garlic, pine nuts, cheese, and Ligurian olive oil are the flavor. Heat is not part of it. Pounding bruises the basil less than a long blend, so the sauce stays green and sweet instead of dark and bitter.",
    "Pound or pulse briefly and stop while it is still bright. Toss it with pasta off the boil. Boiling pesto turns it dull."
  ),
  "mole-poblano": n(
    "The layered taste is fried chiles, nuts, seeds, and spices, with a little chocolate as one seasoning among many. Puebla’s dried chiles and the fry in fat are why it tastes toasted and deep rather than like a chocolate drink.",
    "Fry the blended puree in fat until it darkens. That fry, not extra chocolate, is what makes mole taste cooked."
  ),
  "nuoc-cham": n(
    "It tastes loud because it seasons mild rice and herbs. Fish sauce is the salt, lime is the acid, sugar softens both, and chile is the heat. Water is there so it is a dip, not a straight splash of fish sauce.",
    "Dissolve the sugar in warm water first. Taste it on a piece of the food it will season, not from the spoon alone. It should be a little strong."
  ),
  "eastern-north-carolina-bbq-sauce": n(
    "Whole-hog pork is fatty. Thin vinegar and pepper cut that fat and soak into chopped meat. There is no tomato or sugar body, so the sauce tastes sharp and hot instead of sweet and thick.",
    "Do not thicken it. If it coats a spoon like ketchup, it has become a different region’s sauce."
  ),
  "kansas-city-bbq-sauce": n(
    "Molasses and tomato make it thick and sweet, and vinegar keeps it from being only sweet. That balance suits ribs and burnt ends, which are already smoky. The sauce is a glaze and a table sauce, not a thin mop.",
    "Simmer until glossy, then brush it on late. Sugar burns if it spends the whole cook on the fire."
  ),
  "alabama-white-sauce": n(
    "Mayonnaise carries pepper and vinegar, so the sauce is pale, tangy, and peppery rather than red and sweet. It was built for smoked chicken, whose mild meat can take a sharp white sauce.",
    "Use plenty of black pepper and keep it cold. The pepper is the heat. Chile is optional."
  ),
  ketchup: n(
    "Long cooking with vinegar and sugar turns tomato from sharp and watery into sweet, sour, and smooth. Earlier English ketchups were mushroom or fish. The American taste is the tomato version of that idea.",
    "Simmer until thick. A short boil tastes like seasoned tomato juice, not ketchup."
  ),
  "american-yellow-mustard": n(
    "Vinegar tames mustard seed and turmeric dyes it yellow. The heat is the seed, softened by acid, which is why it is milder than a fresh English mustard mixed with water.",
    "Let it rest after cooking. Mustard tastes harsh the minute it is mixed and milder the next day."
  ),
  "burger-sauce": n(
    "Mayonnaise makes it creamy, ketchup makes it sweet and pink, and pickle and onion keep it sharp. That mix stands up to a salty grilled patty and a soft bun.",
    "Chop the pickle and onion very fine so the sauce spreads instead of falling off the bun in chunks."
  ),
  chimichurri: n(
    "Parsley, garlic, oregano, vinegar, and oil stay raw, so the sauce tastes fresh and sharp against charred beef. It is a finishing sauce for asado, not a cooked gravy.",
    "Chop by hand if you can. A long blend turns the parsley dark and bitter."
  ),
  pebre: n(
    "Chile, onion, tomato, cilantro, and vinegar are chopped, not cooked, so pebre tastes fresh and hot. Rinsing the onion keeps its raw bite from covering the chile and tomato.",
    "Rinse the diced onion and drain it well. Then salt the bowl and let it sit so the juices come out."
  ),
  "aji-amarillo-sauce": n(
    "Ají amarillo tastes fruity as well as hot. Frying the paste with onion and garlic cooks off the raw edge and leaves that fruit in a savory sauce.",
    "Fry the paste in oil before you add water. Skipping the fry leaves a raw, dusty taste."
  ),
  harissa: n(
    "Dried chiles, garlic, coriander, and caraway, covered in olive oil, are the taste. Caraway is why it does not taste like a plain chile paste. Oil keeps the paste and carries the flavor.",
    "Seed the chiles if you want heat without bitterness, and cover the jar with oil so the top does not dry out."
  ),
  shito: n(
    "Dried fish and shrimp, fried long in chile and oil, taste dark and savory because the seafood and the oil concentrate. It is a cooked condiment, not a fresh pepper salsa.",
    "Cook it slowly until the color deepens and the oil separates. Pale, quickly fried shito tastes raw."
  ),
  maafe: n(
    "Peanuts became a Sahel staple and a sauce base. Tomato and chile season the nut, and a long simmer makes the peanut taste round instead of pasty. Unsweetened peanut butter is the right flavor.",
    "Whisk the peanut butter into hot stock so it dissolves. A lump of cold peanut butter stays grainy."
  ),
  chakalaka: n(
    "Baked beans, tomato, pepper, and curry spices taste like a braai relish because the vegetables are cooked down with the spices, not left raw. Curry powder is the spice trail in this South African pot.",
    "Simmer until thick enough to sit on pap or bread. A watery pot tastes stewed, not like chakalaka."
  ),
  "peri-peri-sauce": n(
    "African bird’s eye chile, garlic, and lemon are the heat and the brightness. Oil or vinegar carries them. The chile is fruity and hot, which is the taste of the sauce on grilled chicken.",
    "Keep some sauce aside before it touches raw chicken if you want a table sauce. Marinade that has held raw meat has to be cooked."
  ),
  moambe: n(
    "Palm fruit, not tomato, is the color and the rich taste. Onion and chile season it. The sauce thickens as the palm cream cooks, which is why it coats chicken and rice.",
    "Simmer gently. A hard boil can split palm cream into grease."
  ),
  hummus: n(
    "Chickpeas, tahini, lemon, and garlic are a shared Levantine balance. Tahini makes it nutty, lemon makes it bright, and ice water makes it light instead of pasty. Olive oil on top is finish, not the body.",
    "Blend tahini and lemon first until pale, then add chickpeas. Ice water, added while blending, loosens the texture."
  ),
  satsivi: n(
    "Walnuts, pounded with garlic, vinegar, and warm spices, thicken the sauce without cream. It is served cool, which sets the walnut paste and softens the garlic. The spices are the Georgian signature.",
    "Grind the walnuts fine and simmer them long enough to lose the raw nut taste. Then cool the sauce fully before you serve it."
  ),
  "afghan-cilantro-chutney": n(
    "Cilantro, chile, garlic, and vinegar stay raw, so the chutney tastes bright and hot next to rich dumplings and grilled meat. Vinegar is the sharp edge.",
    "Blend it the day you eat it. Cilantro dulls if it sits overnight."
  ),
  "mint-coriander-chutney": n(
    "Raw cilantro, mint, green chile, and lemon taste fresh because nothing is cooked. It is the bright sauce next to a sweet tamarind chutney. Cooking it would make a different, duller sauce.",
    "Use stems as well as leaves if they are tender, and salt it enough. A timid green chutney disappears next to fried snacks."
  ),
  "teriyaki-sauce": n(
    "Soy is the salt, mirin and sugar make the shine and the sweetness, and reduction thickens it. The gloss on the food is the point of teri. It is a basting glaze, so it tastes concentrated, not brothy.",
    "Brush it on near the end of grilling. Early brushing burns the sugar."
  ),
  "jerk-marinade": n(
    "Scotch bonnet, allspice, thyme, and scallion are the taste. Allspice, called pimento in Jamaica, is the spice that makes it jerk rather than a generic chile paste. The wet paste seasons the surface before smoke.",
    "Cut slits in the meat so the paste gets under the surface. Reserve some paste before it touches raw meat if you want a table sauce."
  ),
  "cuban-mojo": n(
    "Sour orange and a lot of garlic are the taste. Sour orange is sharper than sweet orange. Cumin and oil round it. The sauce is both a pork marinade and a spooning sauce for yuca.",
    "If you cannot buy sour oranges, use equal parts lime and orange juice. Warm the oil and pour it over the garlic so the garlic softens without burning."
  ),
  "bulgogi-sauce": n(
    "Soy, sugar, garlic, and sesame are the savory-sweet taste. Grated pear adds sweetness and tenderizes thin beef, which is why the meat tastes seasoned through after a short rest.",
    "Slice the beef thin and do not skip the pear or another ripe fruit if you want the familiar sweetness and texture."
  ),
  "creme-anglaise": n(
    "The taste is milk, vanilla, and yolk, sweetened. It stays pourable because there is no starch. The moment it boils, the yolk scrambles and the sauce tastes eggy and grainy.",
    "Stir over low heat until it coats a spoon and a finger leaves a line. Strain it. Do not let it boil."
  ),
  "caramel-sauce": n(
    "Sugar cooked to amber tastes bitter-sweet. Cream and butter stop the cooking and make it pourable. Go darker than amber and it tastes burnt, not deeper.",
    "Take the sugar off the heat before the cream goes in, and add warm cream slowly. Cold cream in a ripping-hot pan can seize and spit."
  ),
  "chocolate-sauce": n(
    "Cocoa needs a short simmer with sugar and liquid or it tastes dusty. Butter and cream make it glossy. It is a thin sauce, not a thick ganache.",
    "Simmer the cocoa for a minute after it dissolves. That minute is the difference between chalky and smooth."
  ),
  "sambal-oelek": n(
    "Fresh red chile and salt, crushed, taste bright and hot because they are raw. There is no shrimp paste and no long fry. The seeds and the coarse texture are part of the flavor.",
    "Pound it. Do not cook it if you want sambal oelek. Cooking it with shrimp paste makes sambal terasi."
  ),
  "louisiana-hot-sauce": n(
    "Cayenne and vinegar, simmered and strained, taste thin, sharp, and hot. Thickness is not the goal. The vinegar is why it seasons oysters and greens without covering them.",
    "Strain it if you want it to pour. Leave it a day in the refrigerator. The flavor settles."
  ),
  "samoan-miti": n(
    "Coconut cream is rich and cool. Onion and lime cut it so the sauce tastes bright against hot taro or fish. It is not cooked, so the coconut stays sweet instead of oily.",
    "Salt it and serve it cool. Heat is for the taro, not for the miti."
  ),
  "hawaiian-chili-pepper-water": n(
    "Small hot chiles steeped in water with garlic taste clean and hot, like a table vinegar. It is thin so it can be shaken onto noodles and rice. A cooked ketchup would be a different condiment.",
    "Let it sit overnight. The water tastes mild the hour you mix it and hotter the next day."
  ),
  "feijoa-chutney": n(
    "Feijoa’s perfume is the fruit. Vinegar, ginger, and sugar are the British-style chutney method that New Zealand home cooks used on a local glut. The result is fragrant, sweet, and sharp.",
    "Cook it until a spoon leaves a trail. A thin chutney tastes like stewed fruit, not a preserve."
  ),
  ajvar: n(
    "Roasted red pepper and eggplant taste smoky and sweet because the skins char and the flesh cooks down in oil. Vinegar keeps it from being only sweet. It is an autumn preserve, meant to taste of the roast.",
    "Char the peppers until the skins blacken, then peel them. Skipping the char is why some ajvar tastes like boiled pepper."
  ),
  hovmastarsas: n(
    "Sweet mustard, vinegar, and a large amount of dill balance salty cured salmon. The sugar is there because the fish is salty. Dill is a main ingredient, not a sprinkle.",
    "Stir in a lot of fresh dill and taste it next to the salmon, not on its own. It should be sweet and sharp."
  )
};
