
export function omitFields(obj, fields = []) {
    const modifiedObj = obj.toObject();
    fields.forEach(field => delete modifiedObj[field]);
    return modifiedObj;
  }
  