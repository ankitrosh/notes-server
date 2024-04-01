import { RequestHandler } from "express";
import NoteModel from "../models/note";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { assertIsDefined } from "../util/assertIsDefined";

export const getNotes: RequestHandler = async (req, res, next) => {
  const authenticatedUserId = req.session.userId;
  try {
    assertIsDefined(authenticatedUserId);

    const notes = await NoteModel.find({ userId: authenticatedUserId }).exec();
    res.status(200).json(notes);
  } catch (error) {
    next(error);
  }
};

export const getNote: RequestHandler = async (req, res, next) => {
  const { noteId } = req.params;
  const authenticatedUserId = req.session.userId;
  try {
    assertIsDefined(authenticatedUserId);
    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Please provide a valid note id");
    }

    const note = await NoteModel.findById(noteId).exec();
    if (!note) {
      throw createHttpError(404, "note not found");
    }

    if (!note.userId?.equals(authenticatedUserId)) {
      throw createHttpError(401, "You cannot access this note");
    }
    res.status(200).json({
      data: note,
    });
  } catch (error) {
    next(error);
  }
};

interface ICreateNoteBody {
  title?: string;
  text?: string;
}

export const createNote: RequestHandler<
  unknown,
  unknown,
  ICreateNoteBody,
  unknown
> = async (req, res, next) => {
  const { title, text } = req.body;
  const authenticatedUserId = req.session.userId;
  try {
    assertIsDefined(authenticatedUserId);
    if (!title || !text) {
      throw createHttpError(400, "Please provide title and description");
    }
    const newNote = await NoteModel.create({
      title: title,
      text: text,
      userId: authenticatedUserId,
    });

    res.status(201).json({
      data: newNote,
    });
  } catch (error) {
    next(error);
  }
};

interface IUpdateNoteParams {
  noteId: string;
}

interface IUpdateNoteBody {
  title?: string;
  text?: string;
}

export const updateNote: RequestHandler<
  IUpdateNoteParams,
  unknown,
  IUpdateNoteBody,
  unknown
> = async (req, res, next) => {
  const { noteId } = req.params;
  const { title, text } = req.body;
  const authenticatedUserId = req.session.userId;
  try {
    assertIsDefined(authenticatedUserId);
    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Please provide a valid note id");
    }

    if (!title) {
      throw createHttpError(400, "Please provide title and description");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note?.userId?.equals(authenticatedUserId)) {
      throw createHttpError(401, "You cannot access this note");
    }

    if (!note) {
      throw createHttpError(404, "note not found");
    }

    note.title = title;
    note.text = text;
    const updatedNote = await note.save();

    res.status(200).json({
      data: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNote: RequestHandler = async (req, res, next) => {
  const { noteId } = req.params;
  const authenticatedUserId = req.session.userId;
  try {
    assertIsDefined(authenticatedUserId);
    if (!mongoose.isValidObjectId(noteId)) {
      throw createHttpError(400, "Invalid note id");
    }

    const note = await NoteModel.findById(noteId).exec();

    if (!note?.userId?.equals(authenticatedUserId)) {
      throw createHttpError(401, "You cannot access this note");
    }

    if (!note) {
      throw createHttpError(404, "Note not found");
    }

    await note.deleteOne();
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
