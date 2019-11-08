
function getImageDetails(validationCallback) {
    var $parent = $(this).parent();
    var r = gcd(this.naturalWidth, this.naturalHeight);
    $parent.find(".dimension>span").text(this.naturalWidth + 'x' + this.naturalHeight);
    $parent.find(".aspect-ratio>span").text(this.naturalWidth / r + ':' + this.naturalHeight / r);

    if (typeof validationCallback === "function" && validationCallback) {
        validationCallback.call(this);
    }
}

/** Greatest Common Diviser */
function gcd(w, h) {
    return (h === 0) ? w : gcd(h, w % h);
}

function setupFileReader(imgFile, $imageUploadTemplate, $preview, validationCallback) {
    var $element = $imageUploadTemplate.clone();
    var $img = $element.children("img")[0];
    $img.onload = function (e) {
        getImageDetails.call(this, validationCallback);
    };
    $preview.children(".row").append($element);
    var reader = new FileReader();
    reader.onload = function (e) {
        // console.log(e.target);
        $($img).attr('src', e.target.result);
        $element.find(".size>span").text((imgFile.size / 1024).toFixed(1));
    };
    reader.readAsDataURL(imgFile);
}

export default { setupFileReader, gcd, getImageDetails }