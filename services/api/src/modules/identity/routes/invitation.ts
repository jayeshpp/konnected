import { FastifyPluginAsync } from "fastify";

import {
  AcceptInvitation,
  acceptInvitationSchema,
  declineInvitationSchema,
} from "@konnected/types";
import { acceptInvitation, declineInvitation } from "../controllers/invitation";

const invitationRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/invitations/accept
  app.post<{ Body: AcceptInvitation }>(
    "/accept",
    {
      schema: {
        tags: ["User"],
        summary: "Accept invitation",
        body: acceptInvitationSchema,
        security: [],
      },
    },
    acceptInvitation,
  );
  // POST /api/v1/invitations/decline
  app.post<{ Body: AcceptInvitation }>(
    "/decline",
    {
      schema: {
        tags: ["User"],
        summary: "Decline invitation",
        body: declineInvitationSchema,
        security: [],
      },
    },
    declineInvitation,
  );
};

export default invitationRoutes;
