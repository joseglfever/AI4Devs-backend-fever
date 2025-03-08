import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { Application } from '../../domain/models/Application';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

export const updateCandidateInterviewStage = async (
    candidateId: number,
    applicationId: number,
    interviewStepId: number
): Promise<any> => {
    try {
        // Verificar que el candidato exista
        const candidate = await Candidate.findOne(candidateId);
        if (!candidate) {
            return null;
        }

        // Verificar que la aplicación exista y pertenezca al candidato
        const applicationExists = await prisma.application.findFirst({
            where: {
                id: applicationId,
                candidateId: candidateId
            }
        });

        if (!applicationExists) {
            return null;
        }

        // Verificar que el paso de entrevista exista
        const interviewStepExists = await prisma.interviewStep.findUnique({
            where: {
                id: interviewStepId
            }
        });

        if (!interviewStepExists) {
            return null;
        }

        // Actualizar el paso de entrevista actual
        const updatedApplication = await prisma.application.update({
            where: {
                id: applicationId
            },
            data: {
                currentInterviewStep: interviewStepId
            },
            include: {
                interviewStep: {
                    select: {
                        name: true
                    }
                },
                position: {
                    select: {
                        title: true
                    }
                }
            }
        });

        return {
            candidateId,
            applicationId,
            positionTitle: updatedApplication.position.title,
            newStage: updatedApplication.interviewStep.name
        };
    } catch (error) {
        console.error('Error updating candidate interview stage:', error);
        throw error;
    }
};
