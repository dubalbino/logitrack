import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useClientes } from '@/hooks/useClientes';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, User, Building } from 'lucide-react';
import { fetchCEP, validateCPF, validateCNPJ } from '@/lib/utils';
import toast from 'react-hot-toast';

// --- Zod Schemas for each step ---
const step1Schema = z.object({
  data_cadastro: z.string(),
  nome: z.string().min(3, 'Nome é obrigatório'),
  tipo_pessoa: z.enum(['fisica', 'juridica']),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
});

const step2Schema = z.object({
  telefone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
});

const step3Schema = z.object({
  cep: z.string().min(8, 'CEP é obrigatório'),
  endereco: z.string().min(3, 'Endereço é obrigatório'),
  cidade: z.string().min(3, 'Cidade é obrigatória'),
  uf: z.string().min(2, 'UF é obrigatório'),
  complemento: z.string().optional(),
});

const clienteSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(z.object({ observacao: z.string().optional() }))
  .refine(data => {
    if (data.tipo_pessoa === 'fisica') return data.cpf && validateCPF(data.cpf);
    return true;
  }, { message: 'CPF inválido', path: ['cpf'] })
  .refine(data => {
    if (data.tipo_pessoa === 'juridica') return data.cnpj && validateCNPJ(data.cnpj);
    return true;
  }, { message: 'CNPJ inválido', path: ['cnpj'] });

type ClienteFormValues = z.infer<typeof clienteSchema>;

const steps = [
  { id: 1, name: 'Dados Básicos', fields: ['nome', 'tipo_pessoa', 'cpf', 'cnpj'] },
  { id: 2, name: 'Contato', fields: ['telefone', 'email'] },
  { id: 3, name: 'Endereço', fields: ['cep', 'endereco', 'cidade', 'uf'] },
  { id: 4, name: 'Revisão', fields: [] },
];

const FormCliente = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const { createCliente, updateCliente, clientes } = useClientes();

  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: async () => {
      if (isEditMode) {
        const cliente = clientes.find(c => c.id === id);
        if (cliente) {
          return { ...cliente, tipo_pessoa: cliente.cnpj ? 'juridica' : 'fisica' };
        }
      }
      return {
        data_cadastro: new Date().toISOString().split('T')[0],
        tipo_pessoa: 'fisica',
        nome: '',
        telefone: '',
        email: '',
        cep: '',
        endereco: '',
        cidade: '',
        uf: '',
        cpf: '',
        cnpj: '',
        complemento: '',
        observacao: ''
      };
    }
  });

  const { register, handleSubmit, trigger, getValues, setValue, formState: { errors, isSubmitting } } = form;

  const handleNext = async () => {
    const fields = steps[currentStep].fields;
    const output = await trigger(fields as any, { shouldFocus: true });
    if (!output) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const onSubmit: SubmitHandler<ClienteFormValues> = async (values) => {
    try {
      if (isEditMode) {
        await updateCliente(id!, values);
      } else {
        await createCliente(values as any);
      }
      navigate('/clientes');
    } catch (e) {
      // Error is already handled by the hook
    }
  };
  
  const handleCepSearch = async () => {
    const cep = getValues('cep');
    const toastId = toast.loading('Buscando CEP...');
    try {
        const data = await fetchCEP(cep);
        setValue('endereco', data.endereco, { shouldValidate: true });
        setValue('cidade', data.cidade, { shouldValidate: true });
        setValue('uf', data.uf, { shouldValidate: true });
        toast.success('Endereço preenchido!', { id: toastId });
    } catch (error: any) {
        toast.error(error.message, { id: toastId });
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/clientes')} className="flex items-center gap-2 text-slate-600 hover:text-purple-600 transition">
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-3xl font-bold text-slate-800">
          {isEditMode ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <ol className="flex items-center w-full">
          {steps.map((step, index) => (
            <li key={step.id} className={`flex w-full items-center ${index < steps.length - 1 ? 'after:content-[""] after:w-full after:h-1 after:border-b after:border-4 after:inline-block' : ''} ${index <= currentStep ? 'after:border-purple-500' : 'after:border-slate-200'}`}>
              <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${index <= currentStep ? 'bg-purple-600 text-white' : 'bg-slate-200'}`}>
                {index < currentStep ? <Check size={20}/> : step.id}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Form Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20 min-h-[400px]">
          <form id="cliente-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Dados Básicos */}
            {currentStep === 0 && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="font-medium text-slate-700">Nome Completo*</label>
                        <input {...register('nome')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">Data de Cadastro</label>
                        <input {...register('data_cadastro')} type="date" readOnly className="w-full mt-2 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-500" />
                    </div>
                </div>
                <div>
                    <label className="font-medium text-slate-700">Tipo de Pessoa</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${form.watch('tipo_pessoa') === 'fisica' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                            <input type="radio" {...register('tipo_pessoa')} value="fisica" className="hidden" />
                            <User className={`${form.watch('tipo_pessoa') === 'fisica' ? 'text-purple-600' : 'text-slate-500'}`} />
                            Pessoa Física
                        </label>
                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${form.watch('tipo_pessoa') === 'juridica' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                            <input type="radio" {...register('tipo_pessoa')} value="juridica" className="hidden" />
                            <Building className={`${form.watch('tipo_pessoa') === 'juridica' ? 'text-purple-600' : 'text-slate-500'}`} />
                            Pessoa Jurídica
                        </label>
                    </div>
                </div>
                {form.watch('tipo_pessoa') === 'fisica' ? (
                    <div>
                        <label className="font-medium text-slate-700">CPF*</label>
                        <input {...register('cpf')} placeholder="000.000.000-00" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf.message}</p>}
                    </div>
                ) : (
                    <div>
                        <label className="font-medium text-slate-700">CNPJ*</label>
                        <input {...register('cnpj')} placeholder="00.000.000/0000-00" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.cnpj && <p className="text-red-500 text-xs mt-1">{errors.cnpj.message}</p>}
                    </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Contato */}
            {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="font-medium text-slate-700">Telefone*</label>
                        <input {...register('telefone')} placeholder="(00) 00000-0000" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">E-mail*</label>
                        <input {...register('email')} placeholder="exemplo@email.com" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                </motion.div>
            )}

            {/* Step 3: Endereço */}
            {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="font-medium text-slate-700">CEP*</label>
                            <input {...register('cep')} placeholder="00000-000" className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                            {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep.message}</p>}
                        </div>
                        <button type="button" onClick={handleCepSearch} className="self-end bg-slate-100 text-slate-700 rounded-xl px-4 py-3 hover:bg-slate-200 transition">Buscar CEP</button>
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">Endereço (Rua, Número)*</label>
                        <input {...register('endereco')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                        {errors.endereco && <p className="text-red-500 text-xs mt-1">{errors.endereco.message}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label className="font-medium text-slate-700">Cidade*</label>
                            <input {...register('cidade')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                            {errors.cidade && <p className="text-red-500 text-xs mt-1">{errors.cidade.message}</p>}
                        </div>
                        <div>
                            <label className="font-medium text-slate-700">UF*</label>
                            <input {...register('uf')} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" />
                            {errors.uf && <p className="text-red-500 text-xs mt-1">{errors.uf.message}</p>}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Step 4: Revisão */}
            {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h3 className="font-semibold text-xl text-slate-800">Revisão dos Dados</h3>
                    <div className="bg-slate-50 rounded-xl p-6 space-y-3">
                        <p><strong>Nome:</strong> {getValues('nome')}</p>
                        <p><strong>{getValues('tipo_pessoa') === 'fisica' ? 'CPF' : 'CNPJ'}:</strong> {getValues('cpf') || getValues('cnpj')}</p>
                        <p><strong>Contato:</strong> {getValues('telefone')} / {getValues('email')}</p>
                        <p><strong>Endereço:</strong> {`${getValues('endereco')}, ${getValues('cidade')} - ${getValues('uf')}, CEP: ${getValues('cep')}`}</p>
                    </div>
                    <div>
                        <label className="font-medium text-slate-700">Observações</label>
                        <textarea {...register('observacao')} rows={4} className="w-full mt-2 bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500" placeholder="Adicione observações sobre o cliente..."></textarea>
                    </div>
                </motion.div>
            )}
          </form>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {currentStep > 0 && (
          <button type="button" onClick={handlePrev} className="bg-white border border-slate-300 text-slate-700 rounded-xl px-6 py-3">
            Voltar
          </button>
        )}
        <div className="flex-grow" /> {/* Spacer */}
        {currentStep < steps.length - 1 ? (
          <button type="button" onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl px-8 py-3 shadow-lg">
            Próximo
          </button>
        ) : (
          <button type="submit" form="cliente-form" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl px-8 py-3 shadow-lg">
            {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FormCliente;