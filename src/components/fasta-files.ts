import type {MsgFn} from "@lit/localize"
import {str} from "@lit/localize"

import {formatFasta, parseFasta, type FastaError} from "../model/fasta"
import type {WebwriterDnaSimulation} from "../widgets/webwriter-dna-simulation"

function errorMessage(msg: MsgFn, error: FastaError): string {
  switch (error.kind) {
    case "empty": return msg("The file contains no sequence.")
    case "invalid": return msg(str`Invalid base "${error.character}" at position ${error.position}. Only A, C, G and T are allowed.`)
    case "short": return msg(str`The sequence needs at least ${error.min} bases.`)
    case "long": return msg(str`The sequence is longer than ${error.max} bases.`)
  }
}

/** Reads a FASTA file completely, then returns the function that sets the template strand. */
export async function importFastaFile(widget: WebwriterDnaSimulation, file: File) {
  const result = parseFasta(await file.text())
  if ("error" in result) throw new Error(errorMessage(widget.msg, result.error))
  if (!widget.lesson.canEdit) throw new Error(widget.msg("The lesson cannot be edited right now."))
  const {sequence} = result
  return () => widget.lesson.write({dnaSequence: sequence})
}

/** The authored template strand as a FASTA file, or null while there is none. */
export function exportFastaFile(widget: WebwriterDnaSimulation) {
  const sequence = widget.lesson.value.dnaSequence
  if (!sequence) return null
  const header = "DNA template strand 3'-5' (WebWriter DNA simulation)"
  return new File([formatFasta(sequence, header)], "dna-template-strand.fasta", {type: "text/x-fasta"})
}
