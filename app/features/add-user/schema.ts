import { z } from "zod";

const latinOnly = /^[a-zA-Z0-9\s\-_.@]+$/;
/** Логин и пароль: латиница, цифры, спецсимволы - _ . @ ! # $ % & * + = [ ] { } | ; : ' " , < > ? / \ ` ~ */
const loginPasswordChars = /^[a-zA-Z0-9\-_.@!#$%&*()+=[\]{}|;:'",<>?/\\`~\s]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const createUserSchema = z.object({
  organization_id: z.string().min(1, "Select organization"),
  division: z
    .string()
    .min(1, "Required")
    .regex(latinOnly, "Only Latin letters, digits, spaces, - _ . @"),
  location: z
    .string()
    .min(1, "Required")
    .regex(latinOnly, "Only Latin letters, digits, spaces, - _ . @"),
  name: z
    .string()
    .min(1, "Required")
    .regex(latinOnly, "Only Latin letters, digits, spaces, - _ . @"),
  email: z.string().min(1, "Required").regex(emailRegex, "Invalid email"),
  login: z
    .string()
    .min(8, "Min 8 characters")
    .regex(
      loginPasswordChars,
      "Only Latin letters, digits and special characters (e.g. - _ . @ ! # $ % & *)",
    ),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(
      loginPasswordChars,
      "Only Latin letters, digits and special characters (e.g. - _ . @ ! # $ % & *)",
    ),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.extend({
  password: z
    .string()
    .refine(
      (v) => !v || (v.length >= 8 && loginPasswordChars.test(v)),
      "Min 8 characters, Latin letters, digits and special characters only",
    ),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
