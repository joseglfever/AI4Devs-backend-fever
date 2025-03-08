import { Position } from '../../domain/models/Position';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCandidatesByPosition = async (positionId: number) => {
    try {
        // Primero verificamos que la posición exista
        const position = await Position.findOne(positionId);
        if (!position) {
            return null;
        }

        // Obtenemos las aplicaciones y calculamos las puntuaciones medias
        const applications = await prisma.application.findMany({
            where: {
                positionId: positionId
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                interviewStep: {
                    select: {
                        name: true
                    }
                },
                interviews: {
                    select: {
                        score: true
                    }
                }
            }
        });

        // Procesamos los datos para el formato de respuesta requerido
        const formattedCandidates = applications.map(app => {
            // Calcular la puntuación media de todas las entrevistas
            const scores = app.interviews
                .filter(interview => interview.score !== null && interview.score !== undefined)
                .map(interview => interview.score as number);
            
            const averageScore = scores.length > 0
                ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)
                : 'N/A';

            return {
                candidateId: app.candidate.id,
                fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
                email: app.candidate.email,
                current_interview_step: app.interviewStep.name,
                average_score: averageScore
            };
        });

        return formattedCandidates;
    } catch (error) {
        console.error('Error getting candidates by position:', error);
        throw error;
    }
}; 