import { buildErrorMessage } from "../libs/utils.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json(buildErrorMessage("Route not found"));
};

export const errorHandler = (err, req, res, next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json(buildErrorMessage(err.message));
  }

  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json(buildErrorMessage("Resource already exists"));
  }
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return res
      .status(409)
      .json(buildErrorMessage("Resource has related records and cannot be deleted"));
  }
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json(buildErrorMessage("Referenced resource does not exist"));
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json(buildErrorMessage("Invalid JSON body"));
  }

  console.error(err);
  res.status(500).json(buildErrorMessage("Internal server error"));
};
