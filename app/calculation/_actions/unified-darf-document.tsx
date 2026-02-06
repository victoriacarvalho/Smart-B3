// app/calculation/_actions/unified-darf-document.tsx

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", fontSize: 10 },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Helvetica-Bold",
  },
  section: { marginBottom: 10, border: "1px solid #333", padding: 8 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    paddingTop: 10,
    borderTop: "1px solid #eee",
  },
  label: { fontSize: 8, color: "#555" },
  value: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  field: { width: "48%" },
  totalSection: { marginTop: 20, paddingTop: 10, borderTop: "2px solid #000" },
  totalValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  note: {
    fontSize: 9,
    color: "#444",
    marginTop: 4,
    fontStyle: "italic",
  },
});

interface DarfData {
  apuracao: string;
  valorPrincipal: string;
  codigoReceita: string;
  // Adicionamos um campo opcional para notas/detalhes
  nota?: string;
}

interface UnifiedDarfDocumentProps {
  userName: string;
  apuracao: string;
  acaoData: DarfData | null;
  fiiData: DarfData | null;
  criptoData: DarfData | null;
  valorTotal: string;
}

const DarfSection: React.FC<{ title: string; data: DarfData | null }> = ({
  title,
  data,
}) => {
  if (!data || parseFloat(data.valorPrincipal.replace(",", ".")) <= 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.value}>
          Nenhum imposto devido para esta categoria.
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>04 - Código da Receita</Text>
          <Text style={styles.value}>{data.codigoReceita}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>07 - Valor Principal</Text>
          <Text style={styles.value}>R$ {data.valorPrincipal}</Text>
        </View>
      </View>
      {/* Exibe a nota se existir (ex: aviso sobre Exterior) */}
      {data.nota && <Text style={styles.note}>{data.nota}</Text>}
    </View>
  );
};

export const UnifiedDarfDocument = ({
  userName,
  apuracao,
  acaoData,
  fiiData,
  criptoData,
  valorTotal,
}: UnifiedDarfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>DARF Mensal Unificada - Smart B3</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>01 - Nome</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>02 - Período de Apuração</Text>
            <Text style={styles.value}>{apuracao}</Text>
          </View>
        </View>
      </View>

      <DarfSection title="Ações (Swing/Day Trade)" data={acaoData} />
      <DarfSection title="Fundos Imobiliários (FIIs)" data={fiiData} />
      <DarfSection
        title="Criptomoedas (Nacional e Exterior)"
        data={criptoData}
      />

      <View style={styles.totalSection}>
        <Text style={styles.label}>
          10 - Valor Total (Soma de todos os impostos calculados)
        </Text>
        <Text style={styles.totalValue}>R$ {valorTotal}</Text>
        <Text style={[styles.note, { textAlign: "right" }]}>
          *Valores referentes ao exterior são de recolhimento anual, exibidos
          aqui para controle.
        </Text>
      </View>
    </Page>
  </Document>
);
