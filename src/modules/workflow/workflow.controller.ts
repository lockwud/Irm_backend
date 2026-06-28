import type { Request, Response } from "express";
import { WorkflowService } from "./workflow.service.js";

export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // Whole-workflow endpoints let the current frontend stay fast to integrate:
  // each portal can load/save one shared object while still using role-specific UI.
  getWorkflow = (request: Request, response: Response) => response.json(this.workflowService.getWorkflow(request.user));

  updateWorkflow = (request: Request, response: Response) => response.json(this.workflowService.updateWorkflow(request.body, request.user));

  // Granular endpoints are available for the proper backend phase and Swagger docs.
  // They mirror the UI actions: create students, placements, lesson notes and visits.
  getStudents = (request: Request, response: Response) => response.json(this.workflowService.students(request.user));

  createStudent = (request: Request, response: Response) => response.status(201).json(this.workflowService.createStudent(request.body));

  getPlacements = (request: Request, response: Response) => response.json(this.workflowService.placements(request.user));

  createPlacement = (request: Request, response: Response) => response.status(201).json(this.workflowService.createPlacement(request.body));

  approvePlacement = (request: Request, response: Response) => {
    const placement = this.workflowService.decidePlacement(String(request.params.id), "Approved", request.body?.supervisor);
    if (!placement) return response.status(404).json({ error: "Placement not found" });
    return response.json(placement);
  };

  rejectPlacement = (request: Request, response: Response) => {
    const placement = this.workflowService.decidePlacement(String(request.params.id), "Rejected");
    if (!placement) return response.status(404).json({ error: "Placement not found" });
    return response.json(placement);
  };

  getLessonNotes = (request: Request, response: Response) => response.json(this.workflowService.lessonNotes(request.user));

  createLessonNote = (request: Request, response: Response) => response.status(201).json(this.workflowService.createLessonNote(request.body));

  reviewLessonNote = (request: Request, response: Response) => {
    const note = this.workflowService.reviewLessonNote(String(request.params.id), request.body.status);
    if (!note) return response.status(404).json({ error: "Lesson note not found" });
    return response.json(note);
  };

  getVisits = (request: Request, response: Response) => response.json(this.workflowService.visits(request.user));

  createVisit = (request: Request, response: Response) => response.status(201).json(this.workflowService.createVisit(request.body));

  rescheduleVisit = (request: Request, response: Response) => {
    const visit = this.workflowService.rescheduleVisit(String(request.params.id), request.body);
    if (!visit) return response.status(404).json({ error: "Visit not found" });
    return response.json(visit);
  };

  completeVisit = (request: Request, response: Response) => {
    const visit = this.workflowService.completeVisit(String(request.params.id));
    if (!visit) return response.status(404).json({ error: "Visit not found" });
    return response.json(visit);
  };
}
