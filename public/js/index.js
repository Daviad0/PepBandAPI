function svgLoaded(element){
    let findPattern = "/images/lights.JPG";

    console.log(element.innerHTML.includes(findPattern));

    for(var i = 0; i < images.length; i++){
        element.innerHTML = element.innerHTML.replaceAll(findPattern, images[i]);
    }
}