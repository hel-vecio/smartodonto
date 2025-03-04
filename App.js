import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TextInput, Button, Alert, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import MaskInput from 'react-native-mask-input';

const PRIMARY_COLOR = '#138EF2';
const SECONDARY_COLOR = '#0A6CB8';
const DANGER_COLOR = '#E53935';
const BACKGROUND_COLOR = '#F2F2F2';

const CadastroScreen = ({ navigation }) => {
  const [paciente, setPaciente] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const horaMask = [/\d/, /\d/, ':', /\d/, /\d/];

  const salvarAgendamento = async () => {
    if (!paciente || !data || !hora) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }
    try {
      const id = Date.now().toString();
      const novoAgendamento = { id, paciente, data, hora, observacoes };
      const agendamentosSalvos = await AsyncStorage.getItem('agendamentos');
      const agendamentos = agendamentosSalvos ? JSON.parse(agendamentosSalvos) : [];
      agendamentos.push(novoAgendamento);
      await AsyncStorage.setItem('agendamentos', JSON.stringify(agendamentos));
      Alert.alert('Sucesso', 'Agendamento salvo!');

      setPaciente('');
      setData('');
      setHora('');
      setObservacoes('');

      navigation.navigate('Próximos Agendamentos');
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>Nome do Paciente</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={paciente}
          onChangeText={setPaciente}
        />

        <Text style={styles.formLabel}>Data da Consulta</Text>
        <MaskInput
          style={styles.input}
          mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
          placeholder="DD/MM/AAAA"
          value={data}
          onChangeText={setData}
          keyboardType="numeric"
        />

        <Text style={styles.formLabel}>Horário</Text>
        <MaskInput
          style={styles.input}
          mask={horaMask}
          placeholder="HH:MM"
          value={hora}
          onChangeText={setHora}
          keyboardType="numeric"
        />

        <Text style={styles.formLabel}>Observações</Text>
        <TextInput
          style={[styles.input, styles.observacoesInput]}
          placeholder="Observações ou notas importantes"
          value={observacoes}
          onChangeText={setObservacoes}
          multiline={true}
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.botaoSalvar} onPress={salvarAgendamento}>
          <Text style={styles.botaoSalvarTexto}>Salvar Agendamento</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const AgendamentosScreen = () => {
  const [agendamentos, setAgendamentos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [modalConfirmacaoVisible, setModalConfirmacaoVisible] = useState(false);

  const loadAgendamentos = async () => {
    try {
      const storedAgendamentos = await AsyncStorage.getItem('agendamentos');
      if (storedAgendamentos) {
        const parsedAgendamentos = JSON.parse(storedAgendamentos);

        parsedAgendamentos.sort((a, b) => {
          if (!a.data || !b.data || !a.hora || !b.hora) {
            if (!a.data || !a.hora) return 1;
            if (!b.data || !b.hora) return -1;
            return 0;
          }

          const dataA = a.data.split('/').reverse().join('-') + 'T' + a.hora;
          const dataB = b.data.split('/').reverse().join('-') + 'T' + b.hora;
          return new Date(dataA) - new Date(dataB);
        });

        setAgendamentos(parsedAgendamentos);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAgendamentos();
    }, [])
  );

  const abrirObservacoes = (item) => {
    setAgendamentoSelecionado(item);
    setModalVisible(true);
  };

  const confirmarExclusao = () => {
    setModalVisible(false);
    setTimeout(() => {
      setModalConfirmacaoVisible(true);
    }, 300);
  };

  const excluirAgendamento = async () => {
    if (!agendamentoSelecionado) return;

    try {
      const storedAgendamentos = await AsyncStorage.getItem('agendamentos');
      if (storedAgendamentos) {
        const parsedAgendamentos = JSON.parse(storedAgendamentos);

        let agendamentosAtualizados = parsedAgendamentos.filter(
          (item) => item.id !== agendamentoSelecionado.id
        );

        if (agendamentosAtualizados.length === parsedAgendamentos.length) {
          const index = parsedAgendamentos.findIndex(
            (item) =>
              item.paciente === agendamentoSelecionado.paciente &&
              item.data === agendamentoSelecionado.data &&
              item.hora === agendamentoSelecionado.hora
          );

          if (index !== -1) {
            const newArray = [...parsedAgendamentos];
            newArray.splice(index, 1);
            agendamentosAtualizados = newArray;
          }
        }

        await AsyncStorage.setItem('agendamentos', JSON.stringify(agendamentosAtualizados));

        setAgendamentos(agendamentosAtualizados);

        setModalConfirmacaoVisible(false);

        Alert.alert('Sucesso', 'Agendamento excluído com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      Alert.alert('Erro', 'Não foi possível excluir o agendamento.');
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) {
      return 'Data não informada';
    }

    if (dataString && dataString.includes('/') && dataString.length === 10) {
      return dataString;
    }
    return 'Data inválida';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.textoIntrodutorioTela}>
        Aqui ficam seus próximos agendamentos, por ordem de horário
      </Text>

      {agendamentos.length === 0 ? (
        <View style={styles.semAgendamentos}>
          <Text style={styles.semAgendamentosTexto}>Nenhum agendamento cadastrado</Text>
        </View>
      ) : (
        <FlatList
          data={agendamentos}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.agendamentoCard}
              onPress={() => abrirObservacoes(item)}
            >
              <Text style={styles.nomePaciente}>{item.paciente}</Text>
              <View style={styles.dataHoraContainer}>
                <View style={styles.dataContainer}>
                  <Text style={styles.dataHoraLabel}>Data:</Text>
                  <Text style={styles.dataHoraValor}>{formatarData(item.data)}</Text>
                </View>
                <View style={styles.horaContainer}>
                  <Text style={styles.dataHoraLabel}>Hora:</Text>
                  <Text style={styles.dataHoraValor}>{item.hora || 'Não informada'}</Text>
                </View>
              </View>
              {item.observacoes ? (
                <View style={styles.observacaoPreview}>
                  <Text style={styles.observacaoPreviewLabel}>Observação:</Text>
                  <Text style={styles.observacaoPreviewTexto} numberOfLines={1}>
                    {item.observacoes}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.verMaisTexto}>Toque para ver detalhes</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => item.id || index.toString()}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Agendamento</Text>
            </View>

            {agendamentoSelecionado && (
              <View style={styles.modalBody}>
                <Text style={styles.modalNomePaciente}>{agendamentoSelecionado.paciente}</Text>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Data:</Text>
                  <Text style={styles.modalInfoValor}>
                    {formatarData(agendamentoSelecionado.data)}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Horário:</Text>
                  <Text style={styles.modalInfoValor}>
                    {agendamentoSelecionado.hora || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.modalObservacoes}>
                  <Text style={styles.modalObservacoesLabel}>Observações:</Text>
                  <View style={styles.modalObservacoesContent}>
                    <Text style={styles.modalObservacoesTexto}>
                      {agendamentoSelecionado.observacoes || 'Nenhuma observação registrada'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={styles.modalBotaoExcluir}
                onPress={confirmarExclusao}
              >
                <Text style={styles.modalBotaoExcluirTexto}>Excluir Agendamento</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBotaoFechar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBotaoFecharTexto}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalConfirmacaoVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalConfirmacaoContent}>
            <Text style={styles.modalConfirmacaoTitulo}>Confirmar Exclusão</Text>
            <Text style={styles.modalConfirmacaoTexto}>
              Tem certeza que deseja excluir este agendamento?
            </Text>

            {agendamentoSelecionado && (
              <View style={styles.modalConfirmacaoDetalhes}>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Paciente: </Text>
                  {agendamentoSelecionado.paciente}
                </Text>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Data: </Text>
                  {formatarData(agendamentoSelecionado.data)}
                </Text>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Hora: </Text>
                  {agendamentoSelecionado.hora || 'Não informada'}
                </Text>
              </View>
            )}

            <View style={styles.modalConfirmacaoBotoes}>
              <TouchableOpacity
                style={styles.modalConfirmacaoBotaoCancelar}
                onPress={() => setModalConfirmacaoVisible(false)}
              >
                <Text style={styles.modalConfirmacaoBotaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmacaoBotaoConfirmar}
                onPress={excluirAgendamento}
              >
                <Text style={styles.modalConfirmacaoBotaoConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const CadastroPacienteScreen = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const telefoneMask = [
    '(', /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/
  ];

  const salvarPaciente = async () => {
    if (!nome || !dataNascimento || !telefone) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios: Nome, Data de Nascimento e Telefone!');
      return;
    }

    if (email && !email.includes('@')) {
      Alert.alert('Erro', 'Digite um email válido');
      return;
    }

    try {
      const id = Date.now().toString();
      const novoPaciente = {
        id,
        nome,
        dataNascimento,
        telefone,
        email,
        endereco,
        observacoes,
        dataCadastro: new Date().toLocaleDateString('pt-BR')
      };

      const pacientesSalvos = await AsyncStorage.getItem('pacientes');
      const pacientes = pacientesSalvos ? JSON.parse(pacientesSalvos) : [];

      pacientes.push(novoPaciente);

      await AsyncStorage.setItem('pacientes', JSON.stringify(pacientes));

      Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!');

      setNome('');
      setDataNascimento('');
      setTelefone('');
      setEmail('');
      setEndereco('');
      setObservacoes('');

      navigation.navigate('Listar Pacientes');
    } catch (error) {
      console.error('Erro ao salvar paciente:', error);
      Alert.alert('Erro', 'Não foi possível salvar o paciente.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome completo do paciente"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.formLabel}>Data de Nascimento *</Text>
            <MaskInput
              style={styles.input}
              mask={[/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/]}
              placeholder="DD/MM/AAAA"
              value={dataNascimento}
              onChangeText={setDataNascimento}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>Telefone *</Text>
            <MaskInput
              style={styles.input}
              mask={telefoneMask}
              placeholder="(XX) XXXXX-XXXX"
              value={telefone}
              onChangeText={setTelefone}
              keyboardType="numeric"
            />

            <Text style={styles.formLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="email@exemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>Endereço</Text>
            <TextInput
              style={styles.input}
              placeholder="Endereço completo"
              value={endereco}
              onChangeText={setEndereco}
            />

            <Text style={styles.formLabel}>Observações Médicas</Text>
            <TextInput
              style={[styles.input, styles.observacoesInput]}
              placeholder="Alergias, condições crônicas, medicamentos..."
              value={observacoes}
              onChangeText={setObservacoes}
              multiline={true}
              numberOfLines={4}
            />

            <Text style={styles.camposObrigatorios}>* Campos obrigatórios</Text>

            <TouchableOpacity style={styles.botaoSalvar} onPress={salvarPaciente}>
              <Text style={styles.botaoSalvarTexto}>Cadastrar Paciente</Text>
            </TouchableOpacity>

            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ListarPacientesScreen = ({ navigation }) => {
  const [pacientes, setPacientes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
    const [modalConfirmacaoVisible, setModalConfirmacaoVisible] = useState(false);

    const carregarPacientes = async () => {
      try {
        const pacientesSalvos = await AsyncStorage.getItem('pacientes');
        if (pacientesSalvos) {
          const parsedPacientes = JSON.parse(pacientesSalvos);

          parsedPacientes.sort((a, b) => {
            return a.nome.localeCompare(b.nome);
          });

          setPacientes(parsedPacientes);
        }
      } catch (error) {
        console.error('Erro ao carregar pacientes', error);
        Alert.alert('Erro', 'Não foi possível carregar a lista de pacientes.');
      }
    };

    useFocusEffect(
      useCallback(() => {
        carregarPacientes();
      }, [])
    );

    const abrirDetalhesPaciente = (item) => {
      setPacienteSelecionado(item);
      setModalVisible(true);
    };

    const confirmarExclusao = () => {
      setModalVisible(false);
      setTimeout(() => {
        setModalConfirmacaoVisible(true);
      }, 300);
    };

    const excluirPaciente = async () => {
      if (!pacienteSelecionado) return;

      try {
        const pacientesSalvos = await AsyncStorage.getItem('pacientes');
        if (pacientesSalvos) {
          const parsedPacientes = JSON.parse(pacientesSalvos);

          const pacientesAtualizados = parsedPacientes.filter(
            (item) => item.id !== pacienteSelecionado.id
          );

          await AsyncStorage.setItem('pacientes', JSON.stringify(pacientesAtualizados));

          setPacientes(pacientesAtualizados);

          setModalConfirmacaoVisible(false);

          Alert.alert('Sucesso', 'Paciente excluído com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao excluir paciente:', error);
        Alert.alert('Erro', 'Não foi possível excluir o paciente.');
      }
    };

    const formatarData = (dataString) => {
      if (!dataString) {
        return 'Data não informada';
      }

      if (dataString && dataString.includes('/') && dataString.length === 10) {
        return dataString;
      }
      return 'Data inválida';
    };

    const calcularIdade = (dataNascimento) => {
      if (!dataNascimento || dataNascimento.length !== 10) {
        return 'N/A';
      }

      const partes = dataNascimento.split('/');
      if (partes.length !== 3) {
        return 'N/A';
      }

      const nascimento = new Date(partes[2], partes[1] - 1, partes[0]);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const m = hoje.getMonth() - nascimento.getMonth();

      if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
      }

      return idade + ' anos';
    };

    return (
      <SafeAreaView style={styles.container}>
      <Text style={styles.textoIntrodutorioTela}>
        Lista de pacientes cadastrados
      </Text>

      {pacientes.length === 0 ? (
        <View style={styles.semPacientes}>
          <Text style={styles.semPacientesTexto}>Nenhum paciente cadastrado!</Text>
          <Text style={styles.semPacientesTexto}>Cadastre o primeiro paciente.</Text>
        </View>
      ) : (
        <FlatList
          data={pacientes}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.agendamentoCard}
              onPress={() => abrirDetalhesPaciente(item)}
            >
              <Text style={styles.nomePaciente}>{item.nome}</Text>
              <View style={styles.dataHoraContainer}>
                <View style={styles.dataContainer}>
                  <Text style={styles.dataHoraLabel}>Idade:</Text>
                  <Text style={styles.dataHoraValor}>{calcularIdade(item.dataNascimento)}</Text>
                </View>
                <View style={styles.horaContainer}>
                  <Text style={styles.dataHoraLabel}>Telefone:</Text>
                  <Text style={styles.dataHoraValor}>{item.telefone || 'Não informado'}</Text>
                </View>
              </View>
              {item.observacoes ? (
                <View style={styles.observacaoPreview}>
                  <Text style={styles.observacaoPreviewLabel}>Obs. médicas:</Text>
                  <Text style={styles.observacaoPreviewTexto} numberOfLines={1}>
                    {item.observacoes}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.verMaisTexto}>Toque para ver detalhes</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Paciente</Text>
            </View>

            {pacienteSelecionado && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalNomePaciente}>{pacienteSelecionado.nome}</Text>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Data Nasc:</Text>
                  <Text style={styles.modalInfoValor}>
                    {formatarData(pacienteSelecionado.dataNascimento)} ({calcularIdade(pacienteSelecionado.dataNascimento)})
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Telefone:</Text>
                  <Text style={styles.modalInfoValor}>
                    {pacienteSelecionado.telefone || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>E-mail:</Text>
                  <Text style={styles.modalInfoValor}>
                    {pacienteSelecionado.email || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Endereço:</Text>
                  <Text style={styles.modalInfoValor}>
                    {pacienteSelecionado.endereco || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Cadastro:</Text>
                  <Text style={styles.modalInfoValor}>
                    {pacienteSelecionado.dataCadastro || 'Não informado'}
                  </Text>
                </View>

                <View style={styles.modalObservacoes}>
                  <Text style={styles.modalObservacoesLabel}>Observações Médicas:</Text>
                  <View style={styles.modalObservacoesContent}>
                    <Text style={styles.modalObservacoesTexto}>
                      {pacienteSelecionado.observacoes || 'Nenhuma observação registrada'}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={styles.modalBotaoExcluir}
                onPress={confirmarExclusao}
              >
                <Text style={styles.modalBotaoExcluirTexto}>Excluir Paciente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBotaoFechar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBotaoFecharTexto}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalConfirmacaoVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalConfirmacaoContent}>
            <Text style={styles.modalConfirmacaoTitulo}>Confirmar Exclusão</Text>
            <Text style={styles.modalConfirmacaoTexto}>
              Tem certeza que deseja excluir este paciente?
            </Text>

            {pacienteSelecionado && (
              <View style={styles.modalConfirmacaoDetalhes}>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Paciente: </Text>
                  {pacienteSelecionado.nome}
                </Text>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Data Nasc: </Text>
                  {formatarData(pacienteSelecionado.dataNascimento)}
                </Text>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Telefone: </Text>
                  {pacienteSelecionado.telefone || 'Não informado'}
                </Text>
              </View>
            )}

            <View style={styles.modalConfirmacaoBotoes}>
              <TouchableOpacity
                style={styles.modalConfirmacaoBotaoCancelar}
                onPress={() => setModalConfirmacaoVisible(false)}
              >
                <Text style={styles.modalConfirmacaoBotaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmacaoBotaoConfirmar}
                onPress={excluirPaciente}
              >
                <Text style={styles.modalConfirmacaoBotaoConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SolicitacaoProdutosScreen = ({ navigation }) => {
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');

  const salvarSolicitacao = async () => {
    if (!descricao || !quantidade) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    try {
      const id = Date.now().toString();
      const novaSolicitacao = {
        id,
        descricao,
        quantidade,
        dataSolicitacao: new Date().toLocaleDateString('pt-BR')
      };

      const solicitacoesSalvas = await AsyncStorage.getItem('solicitacoes');
      const solicitacoes = solicitacoesSalvas ? JSON.parse(solicitacoesSalvas) : [];

      solicitacoes.push(novaSolicitacao);

      await AsyncStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));

      Alert.alert('Sucesso', 'Solicitação de produto salva!');

      setDescricao('');
      setQuantidade('');

      navigation.navigate('Listar Produtos Solicitados');
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>Descrição do Produto</Text>
        <TextInput
          style={styles.input}
          placeholder="Descreva o produto solicitado"
          value={descricao}
          onChangeText={setDescricao}
        />

        <Text style={styles.formLabel}>Quantidade</Text>
        <TextInput
          style={styles.input}
          placeholder="Quantidade"
          value={quantidade}
          onChangeText={setQuantidade}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.botaoSalvar} onPress={salvarSolicitacao}>
          <Text style={styles.botaoSalvarTexto}>Salvar Solicitação</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const ListarProdutosScreen = ({ navigation }) => {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  const [modalConfirmacaoVisible, setModalConfirmacaoVisible] = useState(false);

  const carregarSolicitacoes = async () => {
    try {
      const solicitacoesSalvas = await AsyncStorage.getItem('solicitacoes');
      if (solicitacoesSalvas) {
        const parsedSolicitacoes = JSON.parse(solicitacoesSalvas);

        parsedSolicitacoes.sort((a, b) => {
          return a.descricao.localeCompare(b.descricao);
        });

        setSolicitacoes(parsedSolicitacoes);
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações', error);
      Alert.alert('Erro', 'Não foi possível carregar as solicitações.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarSolicitacoes();
    }, [])
  );

  const abrirDetalhesSolicitacao = (item) => {
    setSolicitacaoSelecionada(item);
    setModalVisible(true);
  };

  const confirmarExclusao = () => {
    setModalVisible(false);
    setTimeout(() => {
      setModalConfirmacaoVisible(true);
    }, 300);
  };

  const excluirSolicitacao = async () => {
    if (!solicitacaoSelecionada) return;

    try {
      const solicitacoesSalvas = await AsyncStorage.getItem('solicitacoes');
      if (solicitacoesSalvas) {
        const parsedSolicitacoes = JSON.parse(solicitacoesSalvas);

        const solicitacoesAtualizadas = parsedSolicitacoes.filter(
          (item) => item.id !== solicitacaoSelecionada.id
        );

        await AsyncStorage.setItem('solicitacoes', JSON.stringify(solicitacoesAtualizadas));

        setSolicitacoes(solicitacoesAtualizadas);

        setModalConfirmacaoVisible(false);

        Alert.alert('Sucesso', 'Solicitação excluída com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao excluir solicitação:', error);
      Alert.alert('Erro', 'Não foi possível excluir a solicitação.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.textoIntrodutorioTela}>
        Lista de solicitações de produtos
      </Text>

      {solicitacoes.length === 0 ? (
        <View style={styles.semPacientes}>
          <Text style={styles.semPacientesTexto}>Nenhuma solicitação de produto cadastrada!</Text>
          <Text style={styles.semPacientesTexto}>Cadastre a primeira solicitação.</Text>
        </View>
      ) : (
        <FlatList
          data={solicitacoes}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.agendamentoCard}
              onPress={() => abrirDetalhesSolicitacao(item)}
            >
              <Text style={styles.nomePaciente}>{item.descricao}</Text>
              <View style={styles.dataHoraContainer}>
                <View style={styles.dataContainer}>
                  <Text style={styles.dataHoraLabel}>Quantidade:</Text>
                  <Text style={styles.dataHoraValor}>{item.quantidade}</Text>
                </View>
                <View style={styles.horaContainer}>
                  <Text style={styles.dataHoraLabel}>Data:</Text>
                  <Text style={styles.dataHoraValor}>{item.dataSolicitacao}</Text>
                </View>
              </View>
              {item.observacoes ? (
                <View style={styles.observacaoPreview}>
                  <Text style={styles.observacaoPreviewLabel}>Observação:</Text>
                  <Text style={styles.observacaoPreviewTexto} numberOfLines={1}>
                    {item.observacoes}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.verMaisTexto}>Toque para ver detalhes</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Solicitação</Text>
            </View>

            {solicitacaoSelecionada && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalNomePaciente}>{solicitacaoSelecionada.descricao}</Text>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Quant.:</Text>
                  <Text style={styles.modalInfoValor}>{solicitacaoSelecionada.quantidade}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Data:</Text>
                  <Text style={styles.modalInfoValor}>{solicitacaoSelecionada.dataSolicitacao}</Text>
                </View>

                {solicitacaoSelecionada.observacoes && (
                  <View style={styles.modalObservacoes}>
                    <Text style={styles.modalObservacoesLabel}>Observações:</Text>
                    <View style={styles.modalObservacoesContent}>
                      <Text style={styles.modalObservacoesTexto}>
                        {solicitacaoSelecionada.observacoes}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={styles.modalBotaoExcluir}
                onPress={confirmarExclusao}
              >
                <Text style={styles.modalBotaoExcluirTexto}>Excluir Solicitação</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBotaoFechar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBotaoFecharTexto}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalConfirmacaoVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalConfirmacaoContent}>
            <Text style={styles.modalConfirmacaoTitulo}>Confirmar Exclusão</Text>
            <Text style={styles.modalConfirmacaoTexto}>
              Tem certeza que deseja excluir esta solicitação?
            </Text>

            {solicitacaoSelecionada && (
              <View style={styles.modalConfirmacaoDetalhes}>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Produto: </Text>
                  {solicitacaoSelecionada.descricao}
                </Text>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Quantidade: </Text>
                  {solicitacaoSelecionada.quantidade}
                </Text>
                <Text style={styles.modalConfirmacaoDetalheTexto}>
                  <Text style={styles.modalConfirmacaoDetalheLabel}>Data: </Text>
                  {solicitacaoSelecionada.dataSolicitacao}
                </Text>
              </View>
            )}

            <View style={styles.modalConfirmacaoBotoes}>
              <TouchableOpacity
                style={styles.modalConfirmacaoBotaoCancelar}
                onPress={() => setModalConfirmacaoVisible(false)}
              >
                <Text style={styles.modalConfirmacaoBotaoCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmacaoBotaoConfirmar}
                onPress={excluirSolicitacao}
              >
                <Text style={styles.modalConfirmacaoBotaoConfirmarTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Drawer = createDrawerNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Drawer.Navigator screenOptions={{
          headerStyle: { backgroundColor: PRIMARY_COLOR },
          headerTintColor: '#fff',
          headerTitleAlign: 'center',
          drawerStyle: { backgroundColor: PRIMARY_COLOR },
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#dedede',
        }}>
          <Drawer.Screen name="Cadastro de Agendamento" component={CadastroScreen} />
          <Drawer.Screen name="Cadastro de Paciente" component={CadastroPacienteScreen} />
          <Drawer.Screen name="Solicitar Produtos" component={SolicitacaoProdutosScreen} />
          <Drawer.Screen name="Próximos Agendamentos" component={AgendamentosScreen} />
          <Drawer.Screen name="Listar Pacientes" component={ListarPacientesScreen} />
          <Drawer.Screen name="Listar Produtos Solicitados" component={ListarProdutosScreen} />
        </Drawer.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
    padding: 20
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 16,
    borderRadius: 5,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  observacoesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  botaoSalvar: {
    backgroundColor: PRIMARY_COLOR,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  botaoSalvarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textoIntrodutorioTela: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  semAgendamentos: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  semAgendamentosTexto: {
    fontSize: 16,
    color: '#777',
  },
  agendamentoCard: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 16,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nomePaciente: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dataHoraContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dataContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  horaContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dataHoraLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  dataHoraValor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  observacaoPreview: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
  },
  observacaoPreviewLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  observacaoPreviewTexto: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  verMaisTexto: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    textAlign: 'right',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: PRIMARY_COLOR,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalNomePaciente: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  modalInfoLabel: {
    fontSize: 16,
    color: '#666',
    width: 80,
  },
  modalInfoValor: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  modalObservacoes: {
    marginTop: 10,
  },
  modalObservacoesLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  modalObservacoesContent: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
  },
  modalObservacoesTexto: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalAcoes: {
    marginTop: 10,
  },
  modalBotaoFechar: {
    backgroundColor: SECONDARY_COLOR,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalBotaoFecharTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBotaoExcluir: {
    backgroundColor: DANGER_COLOR,
    padding: 15,
    alignItems: 'center',
  },
  modalBotaoExcluirTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalConfirmacaoContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalConfirmacaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalConfirmacaoTexto: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalConfirmacaoDetalhes: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  modalConfirmacaoDetalheTexto: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  modalConfirmacaoDetalheLabel: {
    fontWeight: 'bold',
  },
  modalConfirmacaoBotoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalConfirmacaoBotaoCancelar: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalConfirmacaoBotaoCancelarTexto: {
    color: '#333',
    fontWeight: '500',
    fontSize: 16,
  },
  modalConfirmacaoBotaoConfirmar: {
    backgroundColor: DANGER_COLOR,
    padding: 12,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmacaoBotaoConfirmarTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default App;