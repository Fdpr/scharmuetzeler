function checkIntersection(svg, element1, element2) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const bbox = svg.getBBox();

  // Set canvas size to match SVG
  canvas.width = bbox.width;
  canvas.height = bbox.height;

  function renderElement(element) {
    // Clone the SVG
    const clone = svg.cloneNode(true);
    // Remove all children except the current element
    Array.from(clone.children).forEach((child) => {
      if (child !== element) clone.removeChild(child);
    });
    // Serialize the SVG to a string
    const svgData = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    return img;
  }

  const img1 = renderElement(element1);
  const img2 = renderElement(element2);

  return new Promise((resolve) => {
    img1.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img1, 0, 0);
      const data1 = ctx.getImageData(0, 0, canvas.width, canvas.height);

      img2.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img2, 0, 0);
        const data2 = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Check pixel overlap
        let intersects = false;
        for (let i = 0; i < data1.data.length; i += 4) {
          if (
            data1.data[i + 3] > 0 && // Element 1 pixel is non-transparent
            data2.data[i + 3] > 0    // Element 2 pixel is non-transparent
          ) {
            intersects = true;
            break;
          }
        }

        resolve(intersects);
      };
    };
  });
}

const svg = document.getElementById('mysvg');
const rect = document.getElementById('rect1');
const image = document.getElementById('image1');

checkIntersection(svg, rect, image).then((intersects) => {
  console.log(intersects ? 'The elements intersect' : 'The elements do not intersect');
});