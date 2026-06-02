/**
 * See https://github.com/roughconsensusandrunningcode/TrainMonitor/wiki/Documentazione-API-FS#dettagli-viaggio-treno for documentation.
 */
export interface ViaggiatrenoTrainStatusResponse {
    numeroTreno: number
    categoria: string
    tipoTreno: "PG" | "ST" | "PP" | "SI" | "SF" | "DV"
    provvedimento: 0 | 1 | 2 | 3
    origine: string
    idOrigine: string
    orarioPartenza: number
    destinazione: string
    idDestinazione: string
    orarioDestinazione: number 
    dataPartenzaTreno: number
    oraUltimoRilevamento?: number
    stazioneUltimoRilevamento: string
    fermate: ViaggiatrenoStop[]
}

export interface ViaggiatrenoStop {
    id: string
    stazione: string
    actualFermataType: 0 | 1 | 2 | 3
    tipoFermata: "P" | "F" | "A"
    partenza_teorica?: number
    partenzaReale?: number
    arrivo_teorico?: number
    arrivoReale?: number
}