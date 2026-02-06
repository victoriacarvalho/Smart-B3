// app/calculation/_components/darf-document.tsx

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 10,
    border: "1px solid #333",
    padding: 8,
  },
  label: {
    fontSize: 8,
    color: "#555",
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  field: {
    width: "48%",
  },
  observation: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#444",
    marginTop: 4,
  },
});

interface DarfDocumentProps {
  userName: string;
  apuracao: string;
  valorPrincipal: string;
  codigoReceita: string;
  observacoes?: string; // Novo campo opcional
}

export const DarfDocument = ({
  userName,
  apuracao,
  valorPrincipal,
  codigoReceita,
  observacoes,
}: DarfDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>
        DARF - Documento de Arrecadação de Receitas Federais
      </Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>01 - Nome / Telefone</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>02 - Período de Apuração</Text>
            <Text style={styles.value}>{apuracao}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>04 - Código da Receita</Text>
            <Text style={styles.value}>{codigoReceita}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>07 - Valor Principal</Text>
            <Text style={styles.value}>R$ {valorPrincipal}</Text>
          </View>
        </View>
      </View>

      {/* Seção de Multa e Juros (Zerados por padrão neste sistema) */}
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>08 - Valor da Multa</Text>
            <Text style={styles.value}>R$ 0,00</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>09 - Valor dos Juros</Text>
            <Text style={styles.value}>R$ 0,00</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>10 - Valor Total</Text>
        <Text style={styles.value}>R$ {valorPrincipal}</Text>
      </View>

      {/* Nova Seção de Observações para Cripto Exterior */}
      {observacoes && (
        <View
          style={[
            styles.section,
            { borderStyle: "dashed", borderColor: "#666" },
          ]}
        >
          <Text style={styles.label}>Observações / Composição do Valor:</Text>
          <Text style={styles.observation}>{observacoes}</Text>
        </View>
      )}
    </Page>
  </Document>
);
