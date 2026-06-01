/**
 * Body returned on an error reponse by the TT API.
 */
export interface TrentinoTrasportiError {
    /** UTC DateTime string representing the instant of the response. */
    timestamp: string
    /** HTTP status code. */
    status: number
    /** Description of the status code. */
    error: string
    /** Error message. */
    message: string
    /** Called URL (without parameters). */
    path: string
}