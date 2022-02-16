class PDFAnnotations {
  constructor(initialData = {}, schema = null) {
    this.annotations = {};
    this.schema = schema;
    if (schema) {
      Object.keys(initialData).forEach(key => {
        if (this.schema[key]) this.annotations[key] = initialData[key];
      });
    } else {
      this.annotations = initialData;
    }
  }

  initializeData(annotations, container) {
    annotations = this.applySchema(annotations);
    annotations.forEach(annotation => {
      if (!this.annotations[annotation.fieldName])
        this.annotations[annotation.fieldName] = annotation.fieldValue || "";
    });
    this.container = container;
  }

  getData() {
    return this.annotations;
  }

  saveData(data) {
    this.annotations[data.id] = data.value;
  }

  applySchema(annotations) {
    if (!this.schema) return annotations;
    return annotations.filter(annotation => this.schema[annotation.fieldName]);
  }
}

export default PDFAnnotations;
