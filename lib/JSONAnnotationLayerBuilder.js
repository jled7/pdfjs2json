/* Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NullL10n } from "pdfjs-dist/lib/web/ui_utils";
import { SimpleLinkService } from "pdfjs-dist/lib/web/pdf_link_service";
import AnnotationLayer from "./AnnotationLayer";

/**
 * @typedef {Object} AnnotationLayerBuilderOptions
 * @property {HTMLDivElement} pageDiv
 * @property {PDFPage} pdfPage
 * @property {string} imageResourcesPath - (optional) Path for image resources,
 *   mainly for annotation icons. Include trailing slash.
 * @property {boolean} renderInteractiveForms
 * @property {IPDFLinkService} linkService
 * @property {DownloadManager} downloadManager
 * @property {IL10n} l10n - Localization service.
 */

class AnnotationLayerBuilder {
  /**
   * @param {AnnotationLayerBuilderOptions} options
   */
  constructor({
    pageDiv,
    pdfPage,
    linkService,
    downloadManager,
    imageResourcesPath = "",
    renderInteractiveForms = false,
    l10n = NullL10n,
    pdfAnnotations
  }) {
    this.pageDiv = pageDiv;
    this.pdfPage = pdfPage;
    this.linkService = linkService;
    this.downloadManager = downloadManager;
    this.imageResourcesPath = imageResourcesPath;
    this.renderInteractiveForms = renderInteractiveForms;
    this.l10n = l10n;
    this.pdfAnnotations = pdfAnnotations;
    this.div = null;
    this._cancelled = false;
  }

  /**
   * @param {PageViewport} viewport
   * @param {string} intent (default value is 'display')
   */
  render(viewport = this.pdfPage.getViewport(2), intent = "display") {
    this.pdfPage.getAnnotations({ intent }).then(annotations => {
      if (this._cancelled) {
        return;
      }
      let parameters = {
        viewport: viewport.clone({ dontFlip: true }),
        div: this.div,
        annotations: this.pdfAnnotations.applySchema(annotations),
        annotationObject: this.pdfAnnotations,
        page: this.pdfPage,
        imageResourcesPath: this.imageResourcesPath,
        renderInteractiveForms: this.renderInteractiveForms,
        linkService: this.linkService,
        downloadManager: this.downloadManager
      };
      if (this.div) {
        // If an annotationLayer already exists, refresh its children's
        // transformation matrices.
        AnnotationLayer.update(parameters);
      } else {
        // Create an annotation layer div and render the annotations
        // if there is at least one annotation.
        if (annotations.length === 0) {
          return;
        }
        this.div = document.createElement("div");
        this.div.className = "annotationLayer";
        this.pageDiv.appendChild(this.div);
        parameters.div = this.div;

        AnnotationLayer.render(parameters);
        this.l10n.translate(this.div);
      }
    });
  }

  removeAnnotationLayer() {
    this.pageDiv.querySelector(".annotationLayer").remove();
    this.div = null;
  }

  cancel() {
    this._cancelled = true;
  }

  hide() {
    if (!this.div) {
      return;
    }
    this.div.setAttribute("hidden", "true");
  }
}

/**
 * @implements IPDFAnnotationLayerFactory
 */
class JSONAnnotationLayerFactory {
  /**
   * @param {HTMLDivElement} pageDiv
   * @param {PDFPage} pdfPage
   * @param {string} imageResourcesPath - (optional) Path for image resources,
   *   mainly for annotation icons. Include trailing slash.
   * @param {boolean} renderInteractiveForms
   * @param {IL10n} l10n
   * @returns {AnnotationLayerBuilder}
   */
  constructor(pdfAnnotations) {
    this.pdfAnnotations = pdfAnnotations;
  }

  createAnnotationLayerBuilder(
    pageDiv,
    pdfPage,
    imageResourcesPath = "",
    renderInteractiveForms = false,
    l10n = NullL10n
  ) {
    pdfPage.getAnnotations().then(annotations => {
      this.pdfAnnotations.initializeData(annotations, pageDiv);
    });

    return new AnnotationLayerBuilder({
      pageDiv,
      pdfPage,
      imageResourcesPath,
      renderInteractiveForms,
      linkService: new SimpleLinkService(),
      l10n,
      pdfAnnotations: this.pdfAnnotations
    });
  }
}

export default JSONAnnotationLayerFactory;
