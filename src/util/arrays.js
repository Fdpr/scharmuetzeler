function mergeLists(dataMap, orderedKeys, chunkSize) {
  const result = [];
  let allListsEmpty = false;
  let currentIndex = 0;

  while (!allListsEmpty) {
    allListsEmpty = true;

    for (const key of orderedKeys) {
      const list = dataMap[key];
      const chunk = list.slice(currentIndex, currentIndex + chunkSize);

      if (chunk.length > 0) {
        result.push(...chunk);
        allListsEmpty = false;
      }
    }

    currentIndex += chunkSize;
  }

  return result;
}


/**
 * Sorts a list such that items from the second list appear in the same order as in the second list.
 * Unique items in the first list that are not in the second list are sorted at the end.
 * if key is provided, it is used to extract the key for each item in the two lists.
 */
function neighborhoodSort(listToSort, referenceList, key) {
  // Create a map of last indices in B
  const lastIndicesInB = new Map();
  referenceList.forEach((item, index) => {
    if (key)
      lastIndicesInB.set(item[key], index);
    else
      lastIndicesInB.set(item, index);
  });

  // Sort A based on the last indices in B
  return [...listToSort].sort((a, b) => {
    if (key && !a[key] && !b[key]) return 0;
    if (key && !a[key]) return 1;
    if (key && !b[key]) return -1;
    if (!key) {
      const indexA = lastIndicesInB.has(a) ? lastIndicesInB.get(a) : Infinity;
      const indexB = lastIndicesInB.has(b) ? lastIndicesInB.get(b) : Infinity;
      return indexA - indexB;
    }
    const indexA = lastIndicesInB.has(a[key]) ? lastIndicesInB.get(a[key]) : Infinity;
    const indexB = lastIndicesInB.has(b[key]) ? lastIndicesInB.get(b[key]) : Infinity;
    return indexA - indexB;
  });
}

module.exports = { mergeLists, neighborhoodSort };