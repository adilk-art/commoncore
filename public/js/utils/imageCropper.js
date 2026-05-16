export const allowedMime = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg"
];

export const allowedExt = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp"
];

/*
  Checks whether selected file is actually an image.
  Used before opening cropper modal.
*/
export function isValidImage(file) {
  const mimeOk = allowedMime.includes(file.type.toLowerCase());

  const ext = "." + file.name.split(".").pop().toLowerCase();

  const extOk = allowedExt.includes(ext);

  return mimeOk || extOk;
}

/*
  Opens crop modal and attaches cropper instance.
  file -> selected image
  cropImageEl -> modal image tag
  cropModal -> modal wrapper
  oldCropper -> destroy previous cropper
*/
export function openCropper(file, cropImageEl, cropModal, oldCropper) {
  return new Promise((resolve) => {

    const reader = new FileReader();

    reader.onload = (e) => {

      cropImageEl.src = e.target.result;

      cropModal.classList.add("active");

      if (oldCropper) oldCropper.destroy();

      const cropper = new Cropper(cropImageEl, {
        aspectRatio: 4 / 5,
        viewMode: 1,
        autoCropArea: 1
      });

      resolve(cropper);
    };

    reader.readAsDataURL(file);
  });
}

/*
  Converts cropped canvas into real file object.
  This file is later appended to FormData and uploaded.
*/
export function cropToFile(cropper, index) {
  return new Promise((resolve) => {

    const canvas = cropper.getCroppedCanvas({
      width: 800,
      height: 1000
    });

    const base64 = canvas.toDataURL("image/jpeg", 0.9);

    fetch(base64)
      .then(res => res.blob())
      .then(blob => {

        resolve(
          new File(
            [blob],
            `variant-${Date.now()}-${index}.jpg`,
            { type: "image/jpeg" }
          )
        );

      });

  });
}